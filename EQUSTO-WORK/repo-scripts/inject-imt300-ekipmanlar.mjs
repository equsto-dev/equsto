/**
 * IMT300 → public/data/ekipmanlar.json (tek kayıt, equstoPage ile /imt300)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "public/data/ekipmanlar.json");
const metaPath = path.join(root, "public/data/imt300-product.json");

const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
const list = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
if (!Array.isArray(list)) {
  console.error("[imt300:ekipmanlar] dizi bekleniyor");
  process.exit(1);
}

const marker = "IMT300 Berrak Buz Makinesi";
const idx = list.findIndex((x) => x && String(x.name || "").includes("IMT300"));
const entry = {
  category: "icecek-berrak-buz-makineleri",
  brand: meta.brand || "Skyra",
  name: "Skyra IMT300 Berrak Buz Makinesi (Çift Tepsi)",
  price: "11.500 € + KDV\nTeklif ve proje planı için iletişim",
  specs:
    "Skyra IMT300 Berrak Buz Makinesi (çift tepsi)\r\n\r\n" +
    "Genel Özellikler:\r\n\r\n" +
    "\tKesim gerektirmeden parti halinde berrak buz üretimi\r\n" +
    "\tKüp, büyük/küçük küre, çubuk ve elmas formlar (gıda sınıfı silikon kalıp)\r\n" +
    "\tTek dokunuşla dolum, dondurma, ayırma ve depolama\r\n" +
    "\tPaslanmaz çelik gövde · bar, otel ve premium içecek hatları için\r\n" +
    "\tDetaylı teknik özellikler: equsto.com/imt300\r\n\r\n" +
    "Buz formları (kalıba göre tek parti):\r\n\r\n" +
    "\tKüp: 60 adet · 55 mm\r\n" +
    "\tBüyük küre: 32 adet · Ø75 mm\r\n" +
    "\tKüçük küre: 50 adet · Ø60 mm\r\n" +
    "\tÇubuk: 48 adet · 38×38×102 mm\r\n" +
    "\tElmas: 60 adet · Ø60×55 mm\r\n\r\n" +
    "Teknik Özellikler:\r\n\r\n" +
    "\tElektrik: 220–240 V 50 Hz · üretim 650 W · ayırma 1400 W\r\n" +
    "\tDış ölçü: 870 × 755 × 856 mm\r\n" +
    "\tİç hacim: 750 × 382 × 452 mm\r\n" +
    "\tGövde: SUS201 dış · SUS304 iç\r\n" +
    "\tAğırlık: 110–117 kg (kalıba göre)\r\n" +
    "\tSu: 0,2–8 bar · BSP 1/2″ · ~30 L/döngü\r\n" +
    "\tProgram: ~23 saat (prog.1) · ~28,5 saat sıcak iklim (prog.2)\r\n" +
    "\tOrtam: 5–32 °C · nem ≤85% · <70 dB(A)\r\n",
  images: (meta.images || []).map((im) =>
    String(im.file || "")
      .replace(/^\//, "")
      .replace(/^images\//, "images/")
      .startsWith("images/")
      ? String(im.file).replace(/^\//, "").replace(/\//g, "\\")
      : "images\\imt300\\" + path.basename(im.file || "imt300-1.jpg")
  ),
  equstoPage: "/imt300",
  sku: "IMT300",
  vendor: meta.vendor || "The Space & Vesta",
};

// Görseller public/images/imt300 altında — katalog yolu kök /images/…
entry.images = (meta.images || []).map((im) => {
  const base = path.basename(im.file || "imt300-1.jpg");
  return "/images/imt300/" + base;
});

if (idx >= 0) {
  list[idx] = { ...list[idx], ...entry };
  console.log("[imt300:ekipmanlar] güncellendi, index", idx);
} else {
  list.unshift(entry);
  console.log("[imt300:ekipmanlar] eklendi (başa)");
}

fs.writeFileSync(jsonPath, JSON.stringify(list, null, 4) + "\n", "utf8");
console.log("[imt300:ekipmanlar] →", jsonPath);

execSync("node scripts/generate-file-fallback.mjs", { cwd: root, stdio: "inherit" });
