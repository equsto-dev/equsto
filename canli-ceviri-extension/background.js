/**
 * Service worker: orchestration.
 * Strategy:
 *  1) Captions-first (ignores engine noise completely)
 *  2) Tab-audio → Groq Whisper when captions unavailable
 *  3) Natural TR via Groq LLM, speak with Chrome TTS (female)
 */

const OFFSCREEN_URL = "offscreen.html";

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  if (contexts.length) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ["USER_MEDIA"],
    justification: "Sekme sesini canlı çeviri için yakalamak",
  });
}

async function closeOffscreen() {
  try {
    await chrome.offscreen.closeDocument();
  } catch (_) {}
}

function uiStatus(html, error = false) {
  chrome.runtime.sendMessage({ type: "UI_STATUS", html, error }).catch(() => {});
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Aktif sekme yok");
  if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("edge://") || tab.url?.startsWith("chrome-extension://")) {
    throw new Error("Bu sekmede çalışmaz. Yayını normal bir sitede (YouTube vb.) aç.");
  }
  return tab;
}

async function start() {
  const cfg = await chrome.storage.local.get(["apiKey", "mode", "voiceHint"]);
  if (!cfg.apiKey) return { ok: false, error: "Groq API anahtarı yok" };

  const tab = await getActiveTab();
  const mode = cfg.mode || "captions";

  await chrome.storage.local.set({
    running: true,
    activeTabId: tab.id,
    speakQueueBusy: false,
    captionsAliveUntil: 0,
  });

  // Altyazı izleyici
  const wantCaptions = mode !== "audio";
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "CAPTIONS_START",
      enabled: wantCaptions,
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await chrome.tabs.sendMessage(tab.id, {
      type: "CAPTIONS_START",
      enabled: wantCaptions,
    });
  }

  // Ses yakalama: sadece audio modunda hemen.
  // auto: önce altyazı dene; 10 sn altyazı gelmezse sesi aç.
  // captions: hiç yakalama yok → Chrome sekmeyi susturmaz.
  if (mode === "audio") {
    const ok = await startTabAudio(tab.id, cfg.apiKey, true);
    if (!ok.ok) {
      await chrome.storage.local.set({ running: false });
      return ok;
    }
    uiStatus("<b>Çalışıyor</b> · sekme sesi<br>Yayın geri çalınıyor; Türkçe üstüne biner.");
    return { ok: true, mode: "audio" };
  }

  if (mode === "auto") {
    uiStatus("<b>Çalışıyor</b> · altyazı bekleniyor…<br>10 sn gelmezse ses moduna geçer.");
    setTimeout(async () => {
      const st = await chrome.storage.local.get([
        "running",
        "captionsAliveUntil",
        "mode",
      ]);
      if (!st.running || (st.mode || "captions") === "captions") return;
      if (Date.now() < (st.captionsAliveUntil || 0)) return;
      await startTabAudio(tab.id, cfg.apiKey, false);
      uiStatus("<b>Çalışıyor</b> · ses modu (altyazı yok)<br>Yayın geri çalınıyor.");
    }, 10000);
    return { ok: true, mode: "auto" };
  }

  uiStatus(
    "<b>Çalışıyor</b> · sadece altyazı<br>Yayın sesi değişmez. YouTube’da CC açık olsun."
  );
  return { ok: true, mode: "captions" };
}

async function startTabAudio(tabId, apiKey, aggressive) {
  await ensureOffscreen();
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId,
  });
  const off = await chrome.runtime.sendMessage({
    type: "OFFSCREEN_START",
    streamId,
    apiKey,
    aggressive,
  });
  if (!off?.ok) {
    return { ok: false, error: off?.error || "Sekme sesi alınamadı" };
  }
  return { ok: true };
}

async function stop() {
  const { activeTabId } = await chrome.storage.local.get("activeTabId");
  if (activeTabId) {
    try {
      await chrome.tabs.sendMessage(activeTabId, { type: "CAPTIONS_STOP" });
    } catch (_) {}
  }
  try {
    await chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP" });
  } catch (_) {}
  await closeOffscreen();
  await chrome.storage.local.set({ running: false, activeTabId: null });
  chrome.runtime.sendMessage({ type: "STOPPED", text: "Durduruldu." }).catch(() => {});
  return { ok: true };
}

/**
 * Shared pipeline: English text → natural Turkish → speak
 */
async function pipelineSpeak(enText, source) {
  const text = (enText || "").replace(/\s+/g, " ").trim();
  if (text.length < 2) return;

  // Whisper / altyazı çöp filtreleri
  if (
    /formula\s*(1|one)|live\s*(race\s*)?(commentary|radio)|team\s*radio|thanks for watching/i.test(
      text
    )
  ) {
    return;
  }

  const cfg = await chrome.storage.local.get([
    "apiKey",
    "voiceHint",
    "running",
    "lastSpoken",
    "lastSpokenAt",
  ]);
  if (!cfg.running) return;

  // Dedup near-identical captions
  const now = Date.now();
  if (
    cfg.lastSpoken &&
    text === cfg.lastSpoken &&
    now - (cfg.lastSpokenAt || 0) < 8000
  ) {
    return;
  }
  if (
    cfg.lastSpoken &&
    now - (cfg.lastSpokenAt || 0) < 5000 &&
    (text.includes(cfg.lastSpoken) || cfg.lastSpoken.includes(text))
  ) {
    if (text.length <= cfg.lastSpoken.length) return;
  }

  await chrome.storage.local.set({ lastSpoken: text, lastSpokenAt: now });
  uiStatus(`<b>EN</b> ${escapeHtml(text)}`);

  let tr;
  try {
    tr = await translateNatural(text, cfg.apiKey);
  } catch (e) {
    tr = await translateFallback(text);
  }
  if (!tr) return;
  if (/formula\s*1|canlı anlatım radyosu|takım radyosu/i.test(tr)) return;

  uiStatus(
    `<b>TR</b> ${escapeHtml(tr)}<br><span style="opacity:.7">kaynak: ${source}</span>`
  );

  await ensureOffscreen();
  await chrome.runtime.sendMessage({
    type: "SPEAK",
    text: tr,
    voiceHint: cfg.voiceHint || "female",
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function translateNatural(en, apiKey) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "Sen canlı spor spikerisin. İngilizce cümleyi doğal, akıcı, kısa Türkçeye çevir. " +
            "Sadece çeviriyi yaz. Açıklama ekleme. İsimleri (Verstappen, Hamilton, DRS, pit) olduğu gibi bırak.",
        },
        { role: "user", content: en },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq translate ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}

async function translateFallback(en) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=" +
    encodeURIComponent(en);
  const res = await fetch(url);
  if (!res.ok) return "";
  const data = await res.json();
  return (data?.[0] || []).map((x) => x[0]).join("").trim();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "START") {
      sendResponse(await start());
      return;
    }
    if (msg?.type === "STOP") {
      sendResponse(await stop());
      return;
    }
    if (msg?.type === "CAPTION_TEXT") {
      const { mode } = await chrome.storage.local.get("mode");
      if ((mode || "auto") === "audio") {
        sendResponse({ ok: true, ignored: true });
        return;
      }
      await pipelineSpeak(msg.text, "altyazı");
      // When captions are flowing, tell offscreen to back off briefly
      chrome.runtime.sendMessage({ type: "CAPTIONS_ALIVE" }).catch(() => {});
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === "AUDIO_TEXT") {
      const { mode, captionsAliveUntil } = await chrome.storage.local.get([
        "mode",
        "captionsAliveUntil",
      ]);
      const m = mode || "auto";
      if (m === "captions") {
        sendResponse({ ok: true, ignored: true });
        return;
      }
      // auto: if captions recently seen, skip audio STT (avoid double speak)
      if (m === "auto" && Date.now() < (captionsAliveUntil || 0)) {
        sendResponse({ ok: true, ignored: true });
        return;
      }
      await pipelineSpeak(msg.text, "ses");
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === "CAPTIONS_ALIVE") {
      await chrome.storage.local.set({
        captionsAliveUntil: Date.now() + 12000,
      });
      sendResponse({ ok: true });
      return;
    }
    if (msg?.type === "OFFSCREEN_ERROR") {
      uiStatus(msg.error || "Ses yakalama hatası", true);
      sendResponse({ ok: true });
      return;
    }
  })();
  return true;
});
