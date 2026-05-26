/**
 * <head> icindeki file:// guard script UTF-8 meta'dan once calisirsa
 * (em dash vb.) canlida "Invalid or unexpected token" uretir.
 * public/ ve dist/ HTML dosyalarinda charset'i <head> basina tasir;
 * guard script icindeki em dash -> ASCII.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUARD = "/** file:// ile acilinca";

function walkHtml(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkHtml(fp));
    else if (ent.name.endsWith(".html")) out.push(fp);
  }
  return out;
}

function fixGuardBlock(html) {
  const gs = html.indexOf("<script>\n" + GUARD);
  if (gs < 0) {
    const gs2 = html.indexOf("<script>\r\n" + GUARD);
    if (gs2 < 0) return html;
    return fixFromIndex(html, gs2);
  }
  return fixFromIndex(html, gs);
}

function fixFromIndex(html, gs) {
  const endMark = "})();\n</script>";
  const ge = html.indexOf(endMark, gs);
  if (ge < 0) return html;
  const geFull = ge + endMark.length;
  let block = html.slice(gs, geFull);
  block = block.replace(/\u2014/g, "-").replace(/\u2013/g, "-");
  return html.slice(0, gs) + block + html.slice(geFull);
}

function repairBrokenGuardString(html) {
  return html.replace(
    /'<!DOCTYPE html><html lang="tr"><head>\s*\r?\n<title>Equsto - yerel sunucu gerekli<\/title>' \+/g,
    "'<!DOCTYPE html><html lang=\"tr\"><head><title>Equsto - yerel sunucu gerekli</title>' +"
  );
}

function moveCharsetFirst(html) {
  if (!html.includes(GUARD)) return html;
  if (/<head>\s*<meta charset/i.test(html)) return html;

  const charset = '<meta charset="UTF-8">\n';
  const httpEq = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n';
  const scriptEnd = html.indexOf("})();\n</script>");
  if (scriptEnd < 0) return html.replace(/<head>\s*/i, `<head>\n${charset}${httpEq}`);

  const after = scriptEnd + "})();\n</script>".length;
  const headPos = html.indexOf("<head>");
  if (headPos < 0) return html;
  const headOpenEnd = headPos + "<head>".length;

  let tail = html.slice(after);
  tail = tail.replace(/\s*<meta charset="UTF-8">\s*/gi, "\n");
  tail = tail.replace(/\s*<meta http-equiv="Content-Type" content="text\/html; charset=UTF-8">\s*/gi, "\n");

  return (
    html.slice(0, headOpenEnd) +
    `\n${charset}${httpEq}` +
    html.slice(headOpenEnd, after) +
    tail
  );
}

function fixFile(fp) {
  let html = fs.readFileSync(fp, "utf8");
  if (!html.includes(GUARD)) return false;
  const next = moveCharsetFirst(repairBrokenGuardString(fixGuardBlock(html)));
  if (next === html) return false;
  fs.writeFileSync(fp, next, "utf8");
  return true;
}

let n = 0;
for (const dir of [path.join(root, "public"), path.join(root, "dist")]) {
  for (const fp of walkHtml(dir)) {
    if (fixFile(fp)) n++;
  }
}
console.log("[fix-html-head-charset]", n, "html guncellendi.");
