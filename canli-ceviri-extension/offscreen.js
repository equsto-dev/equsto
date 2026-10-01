/**
 * Offscreen: tab audio capture + Groq Whisper + speechSynthesis TTS.
 */

let mediaStream = null;
let audioCtx = null;
let processor = null;
let source = null;
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
const CHUNK_SEC = 2.4;
const MAX_BUFFER_SEC = 6;

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
      captionsBackoffUntil = Date.now() + 12000;
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

  audioCtx = new AudioContext({ sampleRate: SR });
  source = audioCtx.createMediaStreamSource(mediaStream);
  // ScriptProcessor is deprecated but widely available in extension offscreen
  processor = audioCtx.createScriptProcessor(4096, 1, 1);
  source.connect(processor);
  processor.connect(audioCtx.destination); // required for processing; tab already plays in page
  // Mute our tap into destination to avoid double audio — use gain 0
  const mute = audioCtx.createGain();
  mute.gain.value = 0;
  processor.disconnect();
  source.connect(processor);
  processor.connect(mute);
  mute.connect(audioCtx.destination);

  processor.onaudioprocess = (ev) => {
    if (!running || speaking || transcribing) return;
    if (!aggressive && Date.now() < captionsBackoffUntil) return;

    const input = ev.inputBuffer.getChannelData(0);
    // speech-ish energy in mid band proxy: RMS
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const rms = Math.sqrt(sum / input.length);
    if (rms > 0.01) lastSpeechAt = Date.now();

    // Always collect while recently speechy or aggressive
    if (rms > 0.008 || Date.now() - lastSpeechAt < 600) {
      pendingPcm.push(new Float32Array(input));
      pendingSamples += input.length;
    }

    const sec = pendingSamples / SR;
    const silenceFor = Date.now() - lastSpeechAt;
    const shouldFlush =
      (sec >= CHUNK_SEC && silenceFor > 350) ||
      sec >= MAX_BUFFER_SEC;

    if (shouldFlush && pendingSamples > SR * 0.5) {
      const merged = mergePending();
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
    audioCtx?.close();
    mediaStream?.getTracks().forEach((t) => t.stop());
  } catch (_) {}
  processor = null;
  source = null;
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
  // AGC
  let peak = 1e-6;
  for (let i = 0; i < num; i++) peak = Math.max(peak, Math.abs(float32[i]));
  const gain = Math.min(10, 0.8 / peak);
  let offset = 44;
  for (let i = 0; i < num; i++) {
    let s = Math.max(-1, Math.min(1, float32[i] * gain));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function flushToWhisper(float32) {
  if (transcribing || speaking || !apiKey) return;
  transcribing = true;
  try {
    const blob = floatTo16BitWav(float32, SR);
    const fd = new FormData();
    fd.append("file", blob, "chunk.wav");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "en");
    fd.append("response_format", "json");
    fd.append(
      "prompt",
      "Formula One live race commentary and team radio in English."
    );

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
    if (text.length >= 2) {
      chrome.runtime.sendMessage({ type: "AUDIO_TEXT", text });
    }
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
  const tr = voices.filter((v) => /^tr(-|_)/i.test(v.lang) || /turkish/i.test(v.name));
  const pool = tr.length ? tr : voices;
  if (hint === "male") {
    return (
      pool.find((v) => /ahmet|male|erkek/i.test(v.name)) ||
      pool[0] ||
      null
    );
  }
  return (
    pool.find((v) => /emel|female|woman|kadın|gul|yaprak|aysegul|zeynep/i.test(v.name)) ||
    pool.find((v) => /female/i.test(v.name)) ||
    tr[0] ||
    pool[0] ||
    null
  );
}

async function speakTr(text, voiceHint) {
  // Wait for voices
  if (!speechSynthesis.getVoices().length) {
    await new Promise((r) => {
      speechSynthesis.onvoiceschanged = () => r();
      setTimeout(r, 500);
    });
  }
  speaking = true;
  // Don't capture our own TTS if mixed — pause collection
  pendingPcm = [];
  pendingSamples = 0;

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

  // short cooldown against echo into tab capture
  await new Promise((r) => setTimeout(r, 250));
  speaking = false;
}
