/**
 * Her site: sekme sesi yakala → hoparlöre TAM sesle geri ver
 * → Groq Whisper → TR çeviri → Google TTS (kadın)
 */

let stream = null;
let monitor = null; // HTMLAudioElement — yayın sesi (asla kısma)
let ctx = null;
let source = null;
let proc = null;
let apiKey = "";
let running = false;
let speaking = false;
let transcribing = false;
let parts = [];
let samples = 0;
let lastVoice = 0;
let ttsAudio = null;

const TARGET_SR = 16000;
const CHUNK_S = 2.8;
const MAX_S = 5.5;

const BAD = [
  /formula\s*(1|one)/i,
  /live\s*(race\s*)?(commentary|radio)/i,
  /team\s*radio/i,
  /thanks?\s*for\s*watching/i,
  /subscribe/i,
  /canlı anlatım/i,
];

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  (async () => {
    if (msg?.type === "OFFSCREEN_START") {
      sendResponse(await start(msg.streamId, msg.apiKey));
      return;
    }
    if (msg?.type === "OFFSCREEN_STOP") {
      stop();
      sendResponse({ ok: true });
    }
  })();
  return true;
});

async function start(streamId, key) {
  stop();
  apiKey = key;
  running = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
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
    return { ok: false, error: "Sekme sesi alınamadı" };
  }

  ctx = new AudioContext();

  // Yayın sesi: Audio elementi ile tam ses (WebAudio gain ile kısma YOK)
  monitor = new Audio();
  monitor.srcObject = stream;
  monitor.volume = 1;
  await monitor.play().catch(() => {});

  // STT için ayrı analiz yolu — hoparlöre bağlanmaz
  source = ctx.createMediaStreamSource(stream);
  const silent = ctx.createGain();
  silent.gain.value = 0;
  proc = ctx.createScriptProcessor(4096, 1, 1);
  source.connect(proc);
  proc.connect(silent);
  silent.connect(ctx.destination);

  proc.onaudioprocess = (ev) => {
    if (!running || speaking || transcribing) return;
    const input = ev.inputBuffer.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    const rms = Math.sqrt(sum / input.length);
    if (rms > 0.012) lastVoice = Date.now();
    if (rms < 0.009 && Date.now() - lastVoice > 700) return;

    const ratio = ctx.sampleRate / TARGET_SR;
    if (ratio > 1.1) {
      const step = Math.max(1, Math.floor(ratio));
      const down = new Float32Array(Math.floor(input.length / step));
      for (let i = 0, j = 0; j < down.length; i += step, j++) down[j] = input[i];
      parts.push(down);
      samples += down.length;
    } else {
      parts.push(new Float32Array(input));
      samples += input.length;
    }

    const sec = samples / TARGET_SR;
    const quiet = Date.now() - lastVoice;
    if ((sec >= CHUNK_S && quiet > 450) || sec >= MAX_S) {
      if (samples < TARGET_SR * 0.8) {
        parts = [];
        samples = 0;
        return;
      }
      const pcm = merge();
      let peak = 0;
      for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
      if (peak < 0.025) return;
      transcribe(pcm);
    }
  };

  return { ok: true };
}

function merge() {
  const out = new Float32Array(samples);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  parts = [];
  samples = 0;
  return out;
}

function stop() {
  running = false;
  speaking = false;
  transcribing = false;
  parts = [];
  samples = 0;
  try {
    if (ttsAudio) ttsAudio.pause();
  } catch (_) {}
  ttsAudio = null;
  try {
    if (monitor) {
      monitor.pause();
      monitor.srcObject = null;
    }
  } catch (_) {}
  monitor = null;
  try {
    if (proc) proc.onaudioprocess = null;
    proc?.disconnect();
    source?.disconnect();
    ctx?.close();
    stream?.getTracks().forEach((t) => t.stop());
  } catch (_) {}
  proc = source = ctx = stream = null;
}

function toWav(float32, sr) {
  const n = float32.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, n * 2, true);
  let peak = 1e-6;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(float32[i]));
  const g = Math.min(8, 0.75 / peak);
  let o = 44;
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, float32[i] * g));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return new Blob([buf], { type: "audio/wav" });
}

function isBad(t) {
  const s = (t || "").trim();
  if (s.length < 3) return true;
  return BAD.some((re) => re.test(s));
}

async function transcribe(pcm) {
  if (transcribing || speaking || !apiKey) return;
  transcribing = true;
  try {
    const fd = new FormData();
    fd.append("file", toWav(pcm, TARGET_SR), "a.wav");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "en");
    fd.append("response_format", "verbose_json");
    fd.append("temperature", "0");
    // prompt YOK

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
      }
    );
    if (!res.ok) return;
    const data = await res.json();
    const text = (data.text || "").trim();
    if (data.segments?.length) {
      const avg =
        data.segments.reduce((a, s) => a + (s.avg_logprob || 0), 0) /
        data.segments.length;
      if (avg < -1.05) return;
    }
    if (isBad(text)) return;
    const tr = await translate(text);
    if (!tr || isBad(tr)) return;
    await speakFemale(tr);
  } catch (_) {
  } finally {
    transcribing = false;
  }
}

async function translate(en) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.15,
        max_tokens: 160,
        messages: [
          {
            role: "system",
            content:
              "İngilizceyi doğal kısa Türkçeye çevir. Sadece çeviriyi yaz. İsimleri koru.",
          },
          { role: "user", content: en },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const t = data.choices?.[0]?.message?.content?.trim();
      if (t) return t;
    }
  } catch (_) {}
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=" +
    encodeURIComponent(en);
  const res = await fetch(url);
  const data = await res.json();
  return (data?.[0] || []).map((x) => x[0]).join("").trim();
}

function chunks(text, max = 160) {
  const out = [];
  let s = text.trim();
  while (s.length) {
    if (s.length <= max) {
      out.push(s);
      break;
    }
    let cut = s.lastIndexOf(" ", max);
    if (cut < 40) cut = max;
    out.push(s.slice(0, cut).trim());
    s = s.slice(cut).trim();
  }
  return out.filter(Boolean);
}

async function speakFemale(text) {
  speaking = true;
  parts = [];
  samples = 0;
  // Yayın sesine DOKUNMA — monitor.volume hep 1
  if (monitor) monitor.volume = 1;
  try {
    for (const part of chunks(text)) {
      if (!running) break;
      await new Promise((resolve) => {
        const url =
          "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=tr&q=" +
          encodeURIComponent(part);
        ttsAudio = new Audio(url);
        ttsAudio.volume = 1;
        ttsAudio.onended = () => resolve();
        ttsAudio.onerror = () => resolve();
        ttsAudio.play().catch(() => resolve());
      });
    }
  } finally {
    if (monitor) monitor.volume = 1;
    speaking = false;
  }
}
