/**
 * market-kasap-sarkuteri-kurulumu — TR gövde 600–700 karakter
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertGeoTrBody,
  normalizeGeoTrBody,
  plainText,
} from "./lib/normalize-geo-tr-body.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE_KEY = "market-kasap-sarkuteri-kurulumu";
const PROFILE = "marketKasap";

const seed =
  "Market kurulumunda müşteri yolculuğu reyondan başlar. Dondurulmuş ada, soğutmalı gondol ve kasap bankosu aynı koridorda akıcı dizilir; paketli gıda ile taze et aynı hatta görünür, hazırlık ve depo arkada ayrılır. " +
  "Kasap ve şarküteri hattında kıyma, dilimleme ve vitrin sergisi farklı zonlardadır. +2/+4 °C teşhir ile −18 °C depo karışmaz; et tahtası, hijyen seti ve hızlı yıkama tazelik güvenliğini taşır. " +
  "Reyon genişliği ve günlük çıkış soğutucu adedini belirler. Liste Proje Fabrikası'nda netleşir; montaj satış mühendisliği planıyla tamamlanır.";

const body = assertGeoTrBody(PAGE_KEY, normalizeGeoTrBody(seed));
console.log(`[ok] ${PAGE_KEY}: ${plainText(body).length} karakter`);

const jsonPaths = [
  path.join(root, "public/data/geo-landings.json"),
  path.join(root, "lib/geo/landings.json"),
];
for (const p of jsonPaths) {
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!data[PAGE_KEY]) throw new Error(`missing ${PAGE_KEY} in ${p}`);
  data[PAGE_KEY].body = body;
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched", path.relative(root, p));
}

const jsPath = path.join(root, "public/eq-geo-landing.js");
let js = fs.readFileSync(jsPath, "utf8");
const escaped = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const re = new RegExp(
  `(${PROFILE}:\\s*\\{[\\s\\S]*?body:\\s*)(?:[\\s\\S]*?)(\\s*,\\s*faq:)`,
  "m"
);
if (!re.test(js)) {
  console.error("[fail] marketKasap body block not found");
  process.exit(1);
}
js = js.replace(re, `$1\n        "${escaped}"$2`);
fs.writeFileSync(jsPath, js, "utf8");
console.log("patched public/eq-geo-landing.js");

const bodies600 = path.join(root, "scripts/geo-bodies-600.json");
const b600 = JSON.parse(fs.readFileSync(bodies600, "utf8"));
b600[PROFILE] = body;
fs.writeFileSync(bodies600, JSON.stringify(b600, null, 2) + "\n", "utf8");
console.log("patched scripts/geo-bodies-600.json");
