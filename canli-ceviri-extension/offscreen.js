/**
 * Offscreen: tab audio capture + Groq Whisper + speechSynthesis TTS.
 *
 * ÖNEMLİ: Chrome tabCapture sekme sesini keser.
 * Bu yüzden yakalanan akışı hoparlöre TAM sesle geri çalmak zorunlu.
 */

let mediaStream = null;
let audioCtx = null;
let processor = null;
let source = null;
let playbackGain = null;
let apiKey = "";
let aggressive = false;
let running = false;
let speaking = false;
let captionsBackoffUntil = 0;
let pendingPcm = [];
let pendingSamples = 0;
let lastSpeechAt = 0;
let transcribing = false;

const SR = 16000;
const CHUNK_SEC = 2.6;
const MAX_BUFFER_SEC = 5;

const HALLUCINATIONS = [
  /formula\s*1/i,
  /formula\s*one/i,
  /live\s*(race\s*)?(commentary|radio)/i,
  /team\s*radio/i,
  /thanks?\s*for\s*watching/i,
  /subscribe/i,
  /\[.*music.*\]/i,
  /^[\s.·•…♪]+$/,
];

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  (async () => {
    if (msg?.type === "OFFSCREEN_START") {
      sendResponse(await startCapture(msg.streamId, msg.apiKey, !!msg.aggressive));
      return;
    }
    if (msg?.type === "OFFSCREEN_STOP") {
      stopCapture();
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === "SPEAK") {
      await speakTr(msg.text, msg.voiceHint || "female");
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === "CAPTIONS_ALIVE") {
      captionsBackoffUntil = Date.now() + 15000;
      // Altyazı varken ses STT'yi durdur — uydurma + çift konuşma olmasın
      pendingPcm = [];
      pendingSamples = 0;
      sendResponse({ ok: true });
      return;
    }
  })();
  return true;
});

async function startCapture(streamId, key, agg) {
  stopCapture();
  apiKey = key;
  aggressive = agg;
  running = true;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });
  } catch (e) {
    running = false;
    return { ok: false, error: "Sekme sesi alınamadı: " + (e.message || e) };
  }

  // Varsayılan sample rate — playback kalitesi için
  audioCtx = new AudioContext();
  source = audioCtx.createMediaStreamSource(mediaStream);

  // 1) Kullanıcının duyması için TAM sesle geri çal (yoksa Chrome sekmeyi susturur)
  playbackGain = audioCtx.createGain();
  playbackGain.gain.value = 1.0;
  source.connect(playbackGain);
  playbackGain.connect(audioCtx.destination);

  // 2) STT için ayrı dal — hoparlöre gitmez
  const silent = audioCtx.createGain();
  silent.gain.value = 0;
  processor = audioCtx.createScriptProcessor(4096, 1, 1);
  source.connect(processor);
  processor.connect(silent);
  silent.connect(audioCtx.destination);

  processor.onaudioprocess = (ev) => {
    if (!running || speaking || transcribing) return;
    if (!aggressive && Date.now() < captionsBackoffUntil) return;

    const input = ev.inputBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const rms = Math.sqrt(sum / input.length);
    if (rms > 0.012) lastSpeechAt = Date.now();

    if (rms > 0.01 || Date.now() - lastSpeechAt < 500) {
      // Resample roughly if context != 16k: simple decimate/hold
      const ratio = audioCtx.sampleRate / SR;
      if (ratio > 1.2) {
        const step = Math.floor(ratio);
        const down = new Float32Array(Math.floor(input.length / step));
        for (let i = 0, j = 0; j < down.length; i += step, j++) down[j] = input[i];
        pendingPcm.push(down);
        pendingSamples += down.length;
      } else {
        pendingPcm.push(new Float32Array(input));
        pendingSamples += input.length;
      }
    }

    const sec = pendingSamples / SR;
    const silenceFor = Date.now() - lastSpeechAt;
    const shouldFlush =
      (sec >= CHUNK_SEC && silenceFor > 400) || sec >= MAX_BUFFER_SEC;

    if (shouldFlush && pendingSamples > SR * 0.7) {
      const merged = mergePending();
      // Çok sessiz parçaları yollama (halüsinasyon kaynağı)
      let peak = 0;
      for (let i = 0; i < merged.length; i++) peak = Math.max(peak, Math.abs(merged[i]));
      if (peak < 0.02) return;
      flushToWhisper(merged);
    }
  };

  return { ok: true };
}

function mergePending() {
  const out = new Float32Array(pendingSamples);
  let off = 0;
  for (const part of pendingPcm) {
    out.set(part, off);
    off += part.length;
  }
  pendingPcm = [];
  pendingSamples = 0;
  return out;
}

function stopCapture() {
  running = false;
  try {
    processor && (processor.onaudioprocess = null);
    processor?.disconnect();
    source?.disconnect();
    playbackGain?.disconnect();
    audioCtx?.close();
    mediaStream?.getTracks().forEach((t) => t.stop());
  } catch (_) {}
  processor = null;
  source = null;
  playbackGain = null;
  audioCtx = null;
  mediaStream = null;
  pendingPcm = [];
  pendingSamples = 0;
}

function floatTo16BitWav(float32, sampleRate) {
  const num = float32.length;
  const buffer = new ArrayBuffer(44 + num * 2);
  const view = new DataView(buffer);
  const writeStr = (o, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + num * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, num * 2, true);
  let peak = 1e-6;
  for (let i = 0; i < num; i++) peak = Math.max(peak, Math.abs(float32[i]));
  const gain = Math.min(8, 0.75 / peak);
  let offset = 44;
  for (let i = 0; i < num; i++) {
    let s = Math.max(-1, Math.min(1, float32[i] * gain));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function isHallucination(text) {
  const t = text.trim();
  if (t.length < 3) return true;
  if (t.split(/\s+/).length <= 2 && /radio|commentary|watching/i.test(t)) return true;
  return HALLUCINATIONS.some((re) => re.test(t));
}

async function flushToWhisper(float32) {
  if (transcribing || speaking || !apiKey) return;
  if (!aggressive && Date.now() < captionsBackoffUntil) return;
  transcribing = true;
  try {
    const blob = floatTo16BitWav(float32, SR);
    const fd = new FormData();
    fd.append("file", blob, "chunk.wav");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "en");
    fd.append("response_format", "verbose_json");
    fd.append("temperature", "0");
    // Prompt YOK — Whisper prompt'u çıktıya sızdırıp "F1 radio" uyduruyordu

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
      }
    );
    if (!res.ok) {
      const err = await res.text();
      chrome.runtime.sendMessage({
        type: "OFFSCREEN_ERROR",
        error: "Whisper: " + err.slice(0, 160),
      });
      return;
    }
    const data = await res.json();
    const text = (data.text || "").trim();
    // no_speech benzeri: çok düşük ortalama logprob varsa at
    if (data.segments?.length) {
      const avg =
        data.segments.reduce((a, s) => a + (s.avg_logprob || 0), 0) /
        data.segments.length;
      if (avg < -1.0) return;
    }
    if (!text || isHallucination(text)) return;
    chrome.runtime.sendMessage({ type: "AUDIO_TEXT", text });
  } catch (e) {
    chrome.runtime.sendMessage({
      type: "OFFSCREEN_ERROR",
      error: String(e.message || e),
    });
  } finally {
    transcribing = false;
  }
}

function pickVoice(hint) {
  const voices = speechSynthesis.getVoices();
  const tr = voices.filter(
    (v) => /^tr(-|_)/i.test(v.lang) || /turkish/i.test(v.name)
  );
  const pool = tr.length ? tr : voices;
  if (hint === "male") {
    return (
      pool.find((v) => /ahmet|male|erkek/i.test(v.name)) || pool[0] || null
    );
  }
  return (
    pool.find((v) =>
      /emel|female|woman|kadın|gul|yaprak|aysegul|zeynep/i.test(v.name)
    ) ||
    pool.find((v) => /female/i.test(v.name)) ||
    tr[0] ||
    pool[0] ||
    null
  );
}

async function speakTr(text, voiceHint) {
  if (!speechSynthesis.getVoices().length) {
    await new Promise((r) => {
      speechSynthesis.onvoiceschanged = () => r();
      setTimeout(r, 500);
    });
  }
  speaking = true;
  pendingPcm = [];
  pendingSamples = 0;

  // TTS sırasında yayın sesini biraz kıs (duyulsun diye tamamen kesme)
  if (playbackGain) playbackGain.gain.value = 0.55;

  await new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tr-TR";
    const v = pickVoice(voiceHint);
    if (v) u.voice = v;
    u.rate = 1.06;
    u.pitch = voiceHint === "female" ? 1.05 : 1.0;
    u.volume = 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });

  if (playbackGain) playbackGain.gain.value = 1.0;
  await new Promise((r) => setTimeout(r, 200));
  speaking = false;
}
