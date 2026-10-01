const $ = (id) => document.getElementById(id);

function setRunning(on) {
  $("start").disabled = on;
  $("stop").disabled = !on;
}

async function load() {
  const s = await chrome.storage.local.get(["apiKey", "sensitivity", "running"]);
  $("apiKey").value = s.apiKey || "";
  $("sensitivity").value = s.sensitivity || "mid";
  setRunning(!!s.running);
}

async function save() {
  await chrome.storage.local.set({
    apiKey: $("apiKey").value.trim(),
    sensitivity: $("sensitivity").value,
  });
}

$("apiKey").addEventListener("change", save);
$("sensitivity").addEventListener("change", save);

$("start").addEventListener("click", async () => {
  $("err").textContent = "";
  await save();
  if (!$("apiKey").value.trim()) {
    $("err").textContent = "Groq key gerekli: console.groq.com/keys";
    return;
  }
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
