/**
 * canli_ceviri.py mantığının Chrome karşılığı
 * ------------------------------------------------
 * 1) Sekme sesini yakala (loopback benzeri)
 * 2) Chrome sekmeyi susturduğu için sesi TAM SEVİYEDE geri çal (asla kısma)
 * 3) Konuşma parçala → Groq Whisper → TR çeviri
 * 4) Kadın ses (Google TTS) — yayın sesinden bağımsız
 */

let stream = null;
let monitor = null;
let ctx = null;
let source = null;
let proc = null;
let apiKey = "";
let running = false;
let speaking = false;
let transcribing = false;
let buf = [];
let bufN = 0;
let speakingSeg = false;
let silentN = 0;
let t0 = 0;
let ttsAudio = null;
let rmsThresh = 0.01;
let speechPad = 0;

const SR = 16000;
const FRAME = 4096;
const MAX_SEC = 3.0;
const MIN_SEC = 0.45;
const SILENCE_SEC = 0.32;

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
      sendResponse(
        await start(msg.streamId, msg.apiKey, msg.sensitivity || "mid")
      );
      return;
    }
    if (msg?.type === "OFFSCREEN_STOP") {
      stopAll();
      sendResponse({ ok: true });
    }
  })();
  return true;
});

function setSensitivity(level) {
  if (level === "low") {
    rmsThresh = 0.018;
    speechPad = 0;
  } else if (level === "high") {
    rmsThresh = 0.006;
    speechPad = 2;
  } else {
    rmsThresh = 0.01;
    speechPad = 1;
  }
}

async function start(streamId, key, sensitivity) {
  stopAll();
  apiKey = key;
  setSensitivity(sensitivity);
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

  // Yayın sesi — HTMLAudio, volume hep 1 (TTS yayın sesini ASLA kısmaz)
  monitor = new Audio();
  monitor.srcObject = stream;
  monitor.volume = 1.0;
  try {
    await monitor.play();
  } catch (_) {}

  ctx = new AudioContext();
  // Analiz için 16k'ya yakın çalış; asıl sampleRate cihazınki olabilir
  source = ctx.createMediaStreamSource(stream);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  proc = ctx.createScriptProcessor(FRAME, 1, 1);
  source.connect(proc);
  proc.connect(mute);
  mute.connect(ctx.destination);

  const preroll = [];
  const prerollMax = 3 + speechPad;

  proc.onaudioprocess = (ev) => {
    if (!running || transcribing) return;
    // TTS sırasında da yayın çalmaya devam eder; sadece STT için örnek toplama
    // (TTS extension sesidir, sekme yakalamasına girmez)
    if (speaking) return;

    const input = ev.inputBuffer.getChannelData(0);
    const ratio = ctx.sampleRate / SR;
    let frame;
    if (ratio > 1.05) {
      const step = Math.max(1, Math.round(ratio));
      frame = new Float32Array(Math.floor(input.length / step));
      for (let i = 0, j = 0; j < frame.length; i += step, j++) frame[j] = input[i];
    } else {
      frame = new Float32Array(input);
    }

    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    const loud = rms > rmsThresh;
    const frameSec = frame.length / SR;
    const silenceNeed = Math.max(2, Math.round(SILENCE_SEC / frameSec));
    const maxFrames = Math.max(4, Math.round(MAX_SEC / frameSec));
    const minFrames = Math.max(2, Math.round(MIN_SEC / frameSec));

    if (!speakingSeg) {
      preroll.push(frame);
      if (preroll.length > prerollMax) preroll.shift();
      if (loud) {
        speakingSeg = true;
        silentN = 0;
        buf = preroll.slice();
        bufN = buf.reduce((a, f) => a + f.length, 0);
        t0 = performance.now() / 1000 - bufN / SR;
        preroll.length = 0;
      }
      return;
    }

    buf.push(frame);
    bufN += frame.length;
    silentN = loud ? 0 : silentN + 1;

    if (silentN >= silenceNeed) {
      if (buf.length >= minFrames) emit(buf, t0);
      buf = [];
      bufN = 0;
      speakingSeg = false;
      silentN = 0;
    } else if (buf.length >= maxFrames) {
      // en sessiz yarıdan kes (python ile aynı fikir)
      const mid = Math.floor(buf.length / 2);
      let best = mid;
      let bestR = Infinity;
      for (let i = mid; i < buf.length; i++) {
        const f = buf[i];
        let s = 0;
        for (let k = 0; k < f.length; k++) s += f[k] * f[k];
        const r = s / f.length;
        if (r < bestR) {
          bestR = r;
          best = i;
        }
      }
      const cut = best + 1;
      emit(buf.slice(0, cut), t0);
      const rest = buf.slice(cut);
      buf = rest;
      bufN = rest.reduce((a, f) => a + f.length, 0);
      t0 += (cut * frame.length) / SR;
    }
  };

  return { ok: true };
}

function emit(frames, startT) {
  const n = frames.reduce((a, f) => a + f.length, 0);
  const pcm = new Float32Array(n);
  let o = 0;
  for (const f of frames) {
    pcm.set(f, o);
    o += f.length;
  }
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  if (peak < 0.02) return;
  transcribe(pcm, startT);
}

function stopAll() {
  running = false;
  speaking = false;
  transcribing = false;
  speakingSeg = false;
  buf = [];
  bufN = 0;
  try {
    ttsAudio?.pause();
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
  const w = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, n * 2, true);
  let peak = 1e-6;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(float32[i]));
  const g = Math.min(10, 0.7 / peak);
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

async function transcribe(pcm, startT) {
  if (transcribing || !apiKey) return;
  // çok gerideyse atla (python max-lag)
  if (performance.now() / 1000 - startT > 6) return;
  transcribing = true;
  try {
    const fd = new FormData();
    fd.append("file", toWav(pcm, SR), "chunk.wav");
    fd.append("model", "whisper-large-v3-turbo");
    fd.append("language", "en");
    fd.append("response_format", "verbose_json");
    fd.append("temperature", "0");

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
    let text = (data.text || "").trim();
    if (data.segments?.length) {
      const avg =
        data.segments.reduce((a, s) => a + (s.avg_logprob || 0), 0) /
        data.segments.length;
      if (avg < -1.0) return;
      // no_speech yüksek segmentleri ele
      text = data.segments
        .filter((s) => (s.no_speech_prob ?? 0) < 0.7)
        .map((s) => s.text || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
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
      const t = (await res.json()).choices?.[0]?.message?.content?.trim();
      if (t) return t;
    }
  } catch (_) {}
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=" +
    encodeURIComponent(en);
  const data = await (await fetch(url)).json();
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
  // YAYIN SESİNE DOKUNMA — monitor.volume hep 1
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
