/**
 * Content script: caption-first path.
 * Watches YouTube captions + HTML5 textTracks.
 * Engine noise is irrelevant here — we read text, not audio.
 */
(() => {
  if (window.__canliCeviriCaptions) return;
  window.__canliCeviriCaptions = true;

  let enabled = false;
  let last = "";
  let lastAt = 0;
  let observer = null;
  let trackTimer = null;

  function emit(text) {
    const t = (text || "").replace(/\s+/g, " ").trim();
    if (t.length < 2) return;
    const now = Date.now();
    if (t === last && now - lastAt < 2500) return;
    // incremental youtube captions often grow; speak on stable pause or clear change
    if (last && t.startsWith(last) && t.length - last.length < 8 && now - lastAt < 1500) {
      last = t;
      return;
    }
    last = t;
    lastAt = now;
    chrome.runtime.sendMessage({ type: "CAPTION_TEXT", text: t }).catch(() => {});
  }

  function readYoutubeCaptions() {
    const nodes = document.querySelectorAll(
      ".ytp-caption-segment, .caption-visual-line, .ytp-caption-window-container span"
    );
    if (!nodes.length) return;
    const text = [...nodes]
      .map((n) => n.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) emit(text);
  }

  function readTextTracks() {
    const videos = document.querySelectorAll("video");
    for (const v of videos) {
      const tracks = v.textTracks;
      if (!tracks) continue;
      for (let i = 0; i < tracks.length; i++) {
        const tr = tracks[i];
        if (tr.kind !== "captions" && tr.kind !== "subtitles") continue;
        if (tr.mode === "disabled") tr.mode = "hidden";
        const cues = tr.activeCues;
        if (!cues?.length) continue;
        const text = [...cues].map((c) => c.text).join(" ").replace(/<[^>]+>/g, " ");
        if (text.trim()) emit(text);
      }
    }
  }

  function startWatch() {
    stopWatch();
    observer = new MutationObserver(() => {
      if (!enabled) return;
      readYoutubeCaptions();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    trackTimer = setInterval(() => {
      if (!enabled) return;
      readYoutubeCaptions();
      readTextTracks();
    }, 400);
  }

  function stopWatch() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (trackTimer) {
      clearInterval(trackTimer);
      trackTimer = null;
    }
  }

  chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
    if (msg?.type === "CAPTIONS_START") {
      enabled = !!msg.enabled;
      if (enabled) startWatch();
      else stopWatch();
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === "CAPTIONS_STOP") {
      enabled = false;
      stopWatch();
      sendResponse({ ok: true });
      return true;
    }
  });
})();
