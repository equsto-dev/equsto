const $ = (id) => document.getElementById(id);

function setRunning(on) {
  $("start").disabled = on;
  $("stop").disabled = !on;
}

async function load() {
  const { apiKey = "", running = false } = await chrome.storage.local.get([
    "apiKey",
    "running",
  ]);
  $("apiKey").value = apiKey;
  setRunning(!!running);
}

$("apiKey").addEventListener("change", async () => {
  await chrome.storage.local.set({ apiKey: $("apiKey").value.trim() });
});

$("start").addEventListener("click", async () => {
  $("err").textContent = "";
  const apiKey = $("apiKey").value.trim();
  if (!apiKey) {
    $("err").textContent = "Groq API anahtarı gerekli (console.groq.com/keys)";
    return;
  }
  await chrome.storage.local.set({ apiKey });
  const res = await chrome.runtime.sendMessage({ type: "START" });
  if (res?.ok) setRunning(true);
  else $("err").textContent = res?.error || "Başlatılamadı";
});

$("stop").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "STOP" });
  setRunning(false);
  $("err").textContent = "";
});

load();
