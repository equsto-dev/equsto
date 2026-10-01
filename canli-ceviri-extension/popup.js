const $ = (id) => document.getElementById(id);

function setRunning(on) {
  $("start").disabled = on;
  $("stop").disabled = !on;
}

function setStatus(html, isErr = false) {
  $("status").innerHTML = html;
  $("status").classList.toggle("err", isErr);
}

async function load() {
  const cfg = await chrome.storage.local.get([
    "apiKey",
    "mode",
    "voiceHint",
    "running",
  ]);
  $("apiKey").value = cfg.apiKey || "";
  $("mode").value = cfg.mode || "captions";
  $("voiceHint").value = cfg.voiceHint || "female";
  setRunning(!!cfg.running);
  if (cfg.running) setStatus("<b>Çalışıyor.</b> Yayın açık; Türkçe ses hoparlöre gidiyor.");
}

async function saveFields() {
  await chrome.storage.local.set({
    apiKey: $("apiKey").value.trim(),
    mode: $("mode").value,
    voiceHint: $("voiceHint").value,
  });
}

$("apiKey").addEventListener("change", saveFields);
$("mode").addEventListener("change", saveFields);
$("voiceHint").addEventListener("change", saveFields);

$("start").addEventListener("click", async () => {
  await saveFields();
  if (!$("apiKey").value.trim()) {
    setStatus("<span class='err'>Groq API anahtarı gerekli.</span>", true);
    return;
  }
  setStatus("Başlıyor…");
  const res = await chrome.runtime.sendMessage({ type: "START" });
  if (res?.ok) {
    setRunning(true);
    setStatus(`<b>Çalışıyor</b> · mod: ${res.mode || "auto"}`);
  } else {
    setStatus(res?.error || "Başlatılamadı", true);
  }
});

$("stop").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "STOP" });
  setRunning(false);
  setStatus("Durduruldu.");
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "UI_STATUS") setStatus(msg.html || msg.text || "", !!msg.error);
  if (msg?.type === "STOPPED") {
    setRunning(false);
    setStatus(msg.text || "Durduruldu.");
  }
});

load();
