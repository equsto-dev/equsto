const OFFSCREEN = "offscreen.html";

async function ensureOffscreen() {
  const list = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN)],
  });
  if (list.length) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN,
    reasons: ["USER_MEDIA", "AUDIO_PLAYBACK"],
    justification: "Sekme sesini dinleyip Türkçe seslendirmek",
  });
}

async function closeOffscreen() {
  try {
    await chrome.offscreen.closeDocument();
  } catch (_) {}
}

async function start() {
  const { apiKey, sensitivity } = await chrome.storage.local.get([
    "apiKey",
    "sensitivity",
  ]);
  if (!apiKey) return { ok: false, error: "API anahtarı yok" };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, error: "Aktif sekme yok" };
  if (/^(chrome|edge|chrome-extension|about):/i.test(tab.url || "")) {
    return { ok: false, error: "Yayını normal bir web sitesinde aç" };
  }

  await ensureOffscreen();
  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
  } catch (e) {
    return { ok: false, error: "Sekme sesi alınamadı (sekme yenile, tekrar dene)" };
  }

  const off = await chrome.runtime.sendMessage({
    type: "OFFSCREEN_START",
    streamId,
    apiKey,
    sensitivity: sensitivity || "mid",
  });
  if (!off?.ok) {
    await closeOffscreen();
    return { ok: false, error: off?.error || "Başlatılamadı" };
  }
  await chrome.storage.local.set({ running: true, activeTabId: tab.id });
  return { ok: true };
}

async function stop() {
  try {
    await chrome.runtime.sendMessage({ type: "OFFSCREEN_STOP" });
  } catch (_) {}
  await closeOffscreen();
  await chrome.storage.local.set({ running: false, activeTabId: null });
  return { ok: true };
}

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  (async () => {
    if (msg?.type === "START") sendResponse(await start());
    else if (msg?.type === "STOP") sendResponse(await stop());
  })();
  return true;
});
