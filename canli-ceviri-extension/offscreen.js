/**
 * Simultane çeviri motoru (Chrome offscreen)
 * ==========================================
 * Profesyonel simultane mantık:
 *  - Kaynak SESİ HİÇ DURMAZ / KISILMAZ (monitor.volume = 1)
 *  - Dinleme TTS sırasında da DEVAM EDER (ear–voice span)
 *  - Kısa anlam birimleri (~1.2–2.0 sn) → STT → çeviri → TTS kuyruğu
 *  - STT / çeviri / TTS boru hattı PARALEL
 *  - Gecikince eski kuyruk atılır, canlıya yetişilir
 *  - Kadın ses (Google TTS)
 */

let stream = null;
let monitor = null;
let ctx = null;
let source = null;
let proc = null;
let apiKey = "";
let running = false;

// --- simultane durum ---
let ring = []; // Float32Array parçaları
let ringN = 0;
let voiced = false;
let silenceFrames = 0;
let segStart = 0;
let lastCommit = 0;
let rmsThresh = 0.01;

let sttInFlight = 0;
const STT_MAX = 2;
const ttsQueue = [];
let ttsPlaying = false;
let ttsAudio = null;

let lastEn = "";
let lastEnAt = 0;
let spokenRecent = []; // son söylenen TR/EN (dedup)

const SR = 16000;
const FRAME = 2048;
// simultane: kısa birimler, düşük kulak-ses mesafesi
const COMMIT_SILENCE_S = 0.22;
const COMMIT_MAX_S = 1.8;
const COMMIT_MIN_S = 0.55;
const OVERLAP_S = 0.25; // birim başı örtüşme (kelime kesilmesin)
const MAX_LAG_S = 4.5;

const BAD = [
  /formula\s*(1|one)/i,
  /live\s*(race\s*)?(commentary|radio)/i,
  /team\s*radio/i,
  /thanks?\s*for\s*watching/i,
  /subscribe\s*(to|now)?/i,
  /canlı anlatım/i,
  /^[\s.·•…♪♫]+$/,
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
  rmsThresh = level === "low" ? 0.016 : level === "high" ? 0.006 : 0.01;
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
  } catch {
    running = false;
    return { ok: false, error: "Sekme sesi alınamadı" };
  }

  // KAYNAK: her zaman tam ses — simultane çevirmenin kuralı
  monitor = new Audio();
  monitor.srcObject = stream;
  monitor.volume = 1;
  await monitor.play().catch(() => {});

  ctx = new AudioContext();
  source = ctx.createMediaStreamSource(stream);
  const sink = ctx.createGain();
  sink.gain.value = 0; // analiz yolu hoparlöre gitmez
  proc = ctx.createScriptProcessor(FRAME, 1, 1);
  source.connect(proc);
  proc.connect(sink);
  sink.connect(ctx.destination);

  proc.onaudioprocess = onProcess;
  return { ok: true };
}

function downsample(input, fromSr, toSr) {
  if (fromSr <= toSr * 1.05) return new Float32Array(input);
  const step = fromSr / toSr;
  const out = new Float32Array(Math.floor(input.length / step));
  for (let i = 0; i < out.length; i++) out[i] = input[Math.floor(i * step)] || 0;
  return out;
}

function rmsOf(frame) {
  let s = 0;
  for (let i = 0; i < frame.length; i++) s += frame[i] * frame[i];
  return Math.sqrt(s / (frame.length || 1));
}

function onProcess(ev) {
  if (!running) return;
  // ÖNEMLİ: TTS çalarken dinlemeye DEVAM (simultane)
  const input = ev.inputBuffer.getChannelData(0);
  const frame = downsample(input, ctx.sampleRate, SR);
  const now = performance.now() / 1000;
  const rms = rmsOf(frame);
  const loud = rms > rmsThresh;
  const frameS = frame.length / SR;
  const silenceNeed = Math.max(2, Math.round(COMMIT_SILENCE_S / frameS));
  const maxFrames = Math.max(4, Math.round(COMMIT_MAX_S / frameS));
  const minSamples = Math.round(COMMIT_MIN_S * SR);

  if (!voiced) {
    // preroll: konuşma başı kaçmasın
    ring.push(frame);
    ringN += frame.length;
    const maxPre = Math.round(0.35 * SR);
    while (ringN > maxPre && ring.length > 1) {
      ringN -= ring[0].length;
      ring.shift();
    }
    if (loud) {
      voiced = true;
      silenceFrames = 0;
      segStart = now - ringN / SR;
    }
    return;
  }

  ring.push(frame);
  ringN += frame.length;
  silenceFrames = loud ? 0 : silenceFrames + 1;

  const longEnough = ringN >= minSamples;
  const naturalEnd = silenceFrames >= silenceNeed && longEnough;
  const forced = ring.length >= maxFrames;

  if (naturalEnd || forced) {
    commitSegment(forced);
  }
}

function commitSegment(forced) {
  if (sttInFlight >= STT_MAX) {
    // boru dolu: en eski halkayı budayıp canlıya yetiş
    const drop = Math.floor(ring.length / 3);
    for (let i = 0; i < drop; i++) {
      ringN -= ring[0].length;
      ring.shift();
    }
    return;
  }

  const overlap = Math.round(OVERLAP_S * SR);
  let keep = [];
  let keepN = 0;
  if (forced && overlap > 0) {
    // zorunlu kesimde son overlap'i bir sonraki segmente bırak
    let need = overlap;
    for (let i = ring.length - 1; i >= 0 && need > 0; i--) {
      keep.unshift(ring[i]);
      keepN += ring[i].length;
      need -= ring[i].length;
    }
  }

  const pcm = flatten(ring);
  const startT = segStart;
  ring = keep;
  ringN = keepN;
  voiced = keepN > 0;
  silenceFrames = 0;
  segStart = performance.now() / 1000 - keepN / SR;
  lastCommit = performance.now() / 1000;

  if (pcm.length < SR * 0.4) return;
  if (rmsOf(pcm) < rmsThresh * 0.5) return;

  pipelineSTT(pcm, startT);
}

function flatten(frames) {
  const n = frames.reduce((a, f) => a + f.length, 0);
  const out = new Float32Array(n);
  let o = 0;
  for (const f of frames) {
    out.set(f, o);
    o += f.length;
  }
  return out;
}

function stopAll() {
  running = false;
  voiced = false;
  ring = [];
  ringN = 0;
  sttInFlight = 0;
  ttsQueue.length = 0;
  ttsPlaying = false;
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
  if (monitor) monitor = null;
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
  const g = Math.min(12, 0.72 / peak);
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
  if (s.length < 2) return true;
  return BAD.some((re) => re.test(s));
}

/** Örtüşen / tekrarlayan metni ayıkla */
function novelText(en) {
  const t = en.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const now = Date.now();
  if (t === lastEn && now - lastEnAt < 5000) return "";
  // önceki cümlenin uzaması
  if (lastEn && t.startsWith(lastEn) && t.length - lastEn.length < 10) {
    lastEn = t;
    return "";
  }
  // yeni metin eskisini kapsıyorsa sadece farkı al
  let out = t;
  if (lastEn && t.startsWith(lastEn)) out = t.slice(lastEn.length).trim();
  else if (lastEn && lastEn.includes(t)) return "";
  // yakın tekrar
  for (const prev of spokenRecent) {
    if (prev === out || (out.length > 12 && prev.includes(out))) return "";
  }
  lastEn = t;
  lastEnAt = now;
  return out;
}

async function pipelineSTT(pcm, startT) {
  const lag0 = performance.now() / 1000 - startT;
  if (lag0 > MAX_LAG_S) return;

  sttInFlight++;
  try {
    const fd = new FormData();
    fd.append("file", toWav(pcm, SR), "seg.wav");
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
      if (avg < -1.05) return;
      text = data.segments
        .filter((s) => (s.no_speech_prob ?? 0) < 0.72)
        .map((s) => s.text || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }
    if (isBad(text)) return;
    const novel = novelText(text);
    if (!novel || isBad(novel)) return;

    const tr = await translate(novel);
    if (!tr || isBad(tr)) return;

    spokenRecent.push(novel);
    if (spokenRecent.length > 8) spokenRecent.shift();

    // gecikme kontrolü: kuyruk şişmesin
    const lag = performance.now() / 1000 - startT;
    if (lag > MAX_LAG_S) {
      ttsQueue.length = 0; // eskiyi at, canlıya yetiş
    }
    ttsQueue.push({ text: tr, t0: startT });
    // en fazla 2 bekleyen cümle
    while (ttsQueue.length > 2) ttsQueue.shift();
    pumpTTS();
  } catch (_) {
  } finally {
    sttInFlight--;
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
        temperature: 0.1,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              "Simultane tercümansın. İngilizce parçayı doğal, kısa, akıcı Türkçeye çevir. " +
              "Sadece çeviriyi yaz. İsim/teknik terimleri (DRS, pit, Verstappen) koru. Açıklama ekleme.",
          },
          { role: "user", content: en },
        ],
      }),
    });
    if (res.ok) {
      const t = (await res.json()).choices?.[0]?.message?.content?.trim();
      if (t) return t.replace(/^["«]|["»]$/g, "").trim();
    }
  } catch (_) {}
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=" +
    encodeURIComponent(en);
  const data = await (await fetch(url)).json();
  return (data?.[0] || []).map((x) => x[0]).join("").trim();
}

function chunkSpeak(text, max = 140) {
  const out = [];
  let s = text.trim();
  while (s.length) {
    if (s.length <= max) {
      out.push(s);
      break;
    }
    let cut = s.lastIndexOf(" ", max);
    if (cut < 30) cut = max;
    out.push(s.slice(0, cut).trim());
    s = s.slice(cut).trim();
  }
  return out.filter(Boolean);
}

async function pumpTTS() {
  if (ttsPlaying) return;
  ttsPlaying = true;
  try {
    while (ttsQueue.length && running) {
      const job = ttsQueue.shift();
      const lag = performance.now() / 1000 - job.t0;
      if (lag > MAX_LAG_S + 1) continue; // yetişilemez, atla

      // kaynak sesine DOKUNMA
      if (monitor) monitor.volume = 1;

      for (const part of chunkSpeak(job.text)) {
        if (!running) break;
        await playGoogleFemale(part);
      }
    }
  } finally {
    if (monitor) monitor.volume = 1;
    ttsPlaying = false;
    if (ttsQueue.length && running) pumpTTS();
  }
}

function playGoogleFemale(text) {
  return new Promise((resolve) => {
    const url =
      "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=tr&q=" +
      encodeURIComponent(text);
    ttsAudio = new Audio(url);
    ttsAudio.volume = 1;
    // kuyruk doluysa biraz hızlı yetiş
    ttsAudio.playbackRate = ttsQueue.length >= 1 ? 1.12 : 1.05;
    ttsAudio.onended = () => resolve();
    ttsAudio.onerror = () => resolve();
    ttsAudio.play().catch(() => resolve());
  });
}
