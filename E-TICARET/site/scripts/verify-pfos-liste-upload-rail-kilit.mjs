/**
 * PFOS sağ panel liste yükleme rail — hizalama + dropzone 2× kilit doğrulama.
 * Kilit: public/pfos-liste-upload-rail-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCK_COMMIT = "2b4c804c";
const DROPZONE_MIN_HEIGHT = "17.5rem";
const DROPZONE_PADDING = "3.2rem 1.05rem";
const RIGHT_COL_FR = "2.8fr";
let err = 0;

function fail(msg) {
  console.error("[verify-pfos-liste-upload-rail-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/pfos-liste-upload-rail-KILIT.txt");

const kilit = read("public/pfos-liste-upload-rail-KILIT.txt");
if (!kilit.includes(LOCK_COMMIT)) {
  fail(`pfos-liste-upload-rail-KILIT.txt: onay commit referansı (${LOCK_COMMIT}) yok`);
}
if (!kilit.includes(DROPZONE_MIN_HEIGHT)) {
  fail("pfos-liste-upload-rail-KILIT.txt: dropzone min-height kilidi yok");
}
if (!kilit.includes(RIGHT_COL_FR)) {
  fail("pfos-liste-upload-rail-KILIT.txt: sağ sütun 2.8fr kilidi yok");
}

[
  "components/pfos/public/PfosPublicWizard.tsx",
  "components/pfos/public/PfosListeUploadRail.tsx",
  "components/pfos/public/workspace/PfosWorkspaceShell.tsx",
  "components/pfos/public/workspace/PfosListeWorkspace.tsx",
  "components/pfos/public/usePfosListeUpload.ts",
  "components/pfos/public/pfos-public.module.css",
].forEach(mustExist);

const wizard = read("components/pfos/public/PfosPublicWizard.tsx");
if (!wizard.includes('id="pfos-progress"')) {
  fail("PfosPublicWizard: pfos-progress id yok — sihirbaz ilerleme korunmalı");
}
if (!wizard.includes("PfosWorkspaceShell")) {
  fail("PfosPublicWizard: workspace shell entegrasyonu yok");
}
const wsShell = read("components/pfos/public/workspace/PfosWorkspaceShell.tsx");
if (!wsShell.includes("data-pfos-workspace")) {
  fail("PfosWorkspaceShell: data-pfos-workspace işaretçisi yok");
}
if (!wizard.includes("PfosListeWorkspace")) {
  fail("PfosPublicWizard: PfosListeWorkspace entegrasyonu yok");
}
if (!wizard.includes("usePfosListeUpload")) {
  fail("PfosPublicWizard: usePfosListeUpload yok");
}
if (wizard.includes("mode=liste") || wizard.includes("PfosListeUpload.tsx")) {
  fail("PfosPublicWizard: ayrı liste modu geri gelmiş");
}

const rail = read("components/pfos/public/PfosListeUploadRail.tsx");
if (!rail.includes("fillHeight")) fail("PfosListeUploadRail: fillHeight prop yok");
if (!rail.includes("uploadRailFill")) fail("PfosListeUploadRail: uploadRailFill sınıfı yok");
if (!rail.includes('data-pfos-dropzone=""')) {
  fail("PfosListeUploadRail: dropzone işaretçisi yok");
}
if (!rail.includes("listeDropZoneRail")) {
  fail("PfosListeUploadRail: listeDropZoneRail stili yok");
}

const hook = read("components/pfos/public/usePfosListeUpload.ts");
if (!hook.includes("export function usePfosListeUpload")) {
  fail("usePfosListeUpload: export yok");
}

const css = read("components/pfos/public/pfos-public.module.css");
if (!css.includes("pfos-liste-upload-rail-KILIT.txt")) {
  fail("pfos-public.module.css: liste upload rail kilit yorumu yok");
}
if (!css.includes(`minmax(0, ${RIGHT_COL_FR})`)) {
  fail(`pfos-public.module.css: sağ sütun ${RIGHT_COL_FR} değişmiş`);
}
if (!css.includes(`min-height: ${DROPZONE_MIN_HEIGHT}`)) {
  fail(`pfos-public.module.css: dropzone min-height ${DROPZONE_MIN_HEIGHT} değil`);
}
if (css.includes("min-height: 8.75rem")) {
  fail("pfos-public.module.css: eski 8.75rem dropzone yüksekliği geri gelmiş");
}
if (!css.includes(`padding: ${DROPZONE_PADDING}`)) {
  fail(`pfos-public.module.css: dropzone padding ${DROPZONE_PADDING} değil`);
}
if (!css.includes(".uploadRailFill")) fail("pfos-public.module.css: uploadRailFill yok");
const fillBlock = css.slice(css.indexOf(".uploadRailFill .listeDropZoneRail"), css.indexOf(".uploadRailFill .railError"));
if (!fillBlock.includes("flex: 1 1 auto")) {
  fail("pfos-public.module.css: uploadRailFill dropzone flex:1 yok");
}
if (!fillBlock.includes("margin-top: auto")) {
  fail("pfos-public.module.css: uploadRailFill dropzone margin-top:auto yok");
}

if (err) {
  console.error(
    "[verify-pfos-liste-upload-rail-kilit] Kilit ihlali — public/pfos-liste-upload-rail-KILIT.txt",
  );
  process.exit(1);
}
console.log(
  "[verify-pfos-liste-upload-rail-kilit] OK — Başlayalım üst hizası · meslek alt hizası · dropzone 2× · sağ rail",
);
