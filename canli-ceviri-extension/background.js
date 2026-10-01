const OFFSCREEN = "offscreen.html";

async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN)],
  });
  if (existing.length) return;
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
  const { apiKey } = await chrome.storage.local.get("apiKey");
  if (!apiKey) return { ok: false, error: "API anahtarı yok" };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, error: "Aktif sekme yok" };
  if (/^(chrome|edge|chrome-extension):/i.test(tab.url || "")) {
    return { ok: false, error: "Bu sekmede olmaz. Yayını normal sitede aç." };
  }

  await ensureOffscreen();
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  });

  const off = await chrome.runtime.sendMessage({
    type: "OFFSCREEN_START",
    streamId,
    apiKey,
  });
  if (!off?.ok) {
    await closeOffscreen();
    return { ok: false, error: off?.error || "Ses alınamadı" };
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
