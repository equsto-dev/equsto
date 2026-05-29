import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.resolve(siteDir, "..", "..", "public", "product.html");
const inlinePath = path.join(siteDir, "public", "eq-product-page-inline.js");

const BUYBOX_HELPERS = `
    function parsePriceTlNumber(raw, item) {
      if (item && Number(item.fiyat_tl) > 0) return Math.round(Number(item.fiyat_tl) * 100) / 100;
      var s = String(raw || "").split("\\n")[0] || "";
      if (!s || /€/.test(s)) return 0;
      var cleaned = s
        .replace(/₺/g, "")
        .replace(/\\+?\\s*KDV.*/gi, "")
        .replace(/KDV\\s*dahil/gi, "")
        .trim()
        .replace(/\\./g, "")
        .replace(",", ".");
      var n3 = parseFloat(cleaned);
      return Number.isFinite(n3) && n3 > 0 ? Math.round(n3 * 100) / 100 : 0;
    }

    function buyboxPriceParts(x) {
      var quoteOnly = !!(x && x.fiyat_bekleniyor) || /teklif\\s+için/i.test(String((x && x.price) || ""));
      if (quoteOnly) return { quoteOnly: true };
      var n = parsePriceTlNumber(x && x.price, x);
      if (!(n > 0) && window.EqustoKurLive && typeof window.EqustoKurLive.computeRowPrices === "function") {
        var rate = window.EqustoKurLive.getRate && window.EqustoKurLive.getRate();
        if (rate) {
          var px = window.EqustoKurLive.computeRowPrices(x, rate);
          if (px && px.fiyat_tl > 0) n = Math.round(Number(px.fiyat_tl) * 100) / 100;
        }
      }
      if (!(n > 0)) return { empty: true };
      var formatted = n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      var ix = formatted.lastIndexOf(",");
      if (ix < 0) return { int: formatted, frac: "" };
      return { int: formatted.slice(0, ix), frac: formatted.slice(ix + 1) };
    }
`;

const PRICE_BLOCK_OLD = `      var priceTxt = extractCartPrice(x.price);
      // Fiyat split: "12.345,67" → int=12.345, frac=67
      var priceInt = priceTxt;
      var priceFrac = "";
      var fracMatch = String(priceTxt || "").match(/^(.*?)(?:,(\\d+))?$/);
      if (fracMatch) {
        priceInt = fracMatch[1] || priceTxt;
        priceFrac = fracMatch[2] || "";
      }
      var priceHTML = priceTxt
        ? '<span class="eq-buybox-currency">₺</span>' +
          '<span class="eq-buybox-int">' + esc(priceInt) + '</span>' +
          (priceFrac ? '<span class="eq-buybox-frac">' + esc(priceFrac) + '</span>' : '')
        : '<span class="eq-buybox-currency">₺</span><span class="eq-buybox-int">—</span>';`;

const PRICE_BLOCK_NEW = `      var priceParts = buyboxPriceParts(x);
      var priceHTML =
        priceParts.quoteOnly
          ? '<span class="eq-buybox-int" style="font-size:1.05rem;">Teklif için iletişim</span>'
          : priceParts.empty
            ? '<span class="eq-buybox-currency">₺</span><span class="eq-buybox-int">—</span>'
            : '<span class="eq-buybox-currency">₺</span><span class="eq-buybox-int">' +
              esc(priceParts.int) +
              "</span>" +
              (priceParts.frac ? '<span class="eq-buybox-frac">,' + esc(priceParts.frac) + "</span>" : "");`;

const html = fs.readFileSync(htmlPath, "utf8");
let inline = fs.readFileSync(inlinePath, "utf8");

if (!inline.includes("function buyboxPriceParts")) {
  const anchor = "function oztiWebRelFromSku";
  const i = inline.indexOf(anchor);
  if (i < 0) throw new Error("extractCartPrice anchor not found");
  inline = inline.slice(0, i) + BUYBOX_HELPERS + "\n\n    " + inline.slice(i);
}

const faqStart = html.indexOf("function productFaqFor");
const faqEnd = html.indexOf("function productEqSk", faqStart);
const faqBlock = html.slice(faqStart, faqEnd).trim();

const rStart = html.indexOf("function renderProduct(x, all)");
let rEnd = html.indexOf('\n    document.addEventListener("DOMContentLoaded"', rStart);
if (rStart < 0 || rEnd < 0) throw new Error("renderProduct block not found in product.html");
let renderFn = html.slice(rStart, rEnd).trim();
renderFn = renderFn
  .replace("function renderProduct", "function renderAmazonGridProduct")
  .replace(/deptLink\(x\.category\)/g, "deptLink(x.category, x.dept)")
  .replace(
    "var imgs = uniqueImgs(x.images);",
    [
      'var root = document.getElementById("eq-product-root");',
      'if (root) root.className = "eq-product-main";',
      "var imgPack = collectProductImgs(x);",
      "var imgs = imgPack.map(function (it) { return it.src; });",
    ].join("\n      "),
  )
  .replace(PRICE_BLOCK_OLD, PRICE_BLOCK_NEW);

if (!inline.includes("function productFaqFor")) {
  const anchor = "function productEqSk";
  const i = inline.indexOf(anchor);
  if (i < 0) throw new Error("productEqSk anchor not found");
  inline = inline.slice(0, i) + faqBlock + "\n\n    " + inline.slice(i);
}

if (inline.includes("function renderAmazonGridProduct")) {
  inline = inline.replace(/function renderAmazonGridProduct[\s\S]*?(?=\n    function renderProduct\(x, all\))/m, "");
}

if (!/function renderProduct\(x, all\)\s*\{\s*renderEpdpProduct/.test(inline)) {
  throw new Error("renderProduct epdp stub not found");
}
inline = inline.replace(
  /function renderProduct\(x, all\)\s*\{\s*renderEpdpProduct\(x, all\);\s*\}/,
  renderFn + "\n\n    function renderProduct(x, all) {\n      renderAmazonGridProduct(x, all);\n    }",
);

fs.writeFileSync(inlinePath, inline);
console.log("restored legacy Amazon PDP render", renderFn.length, "chars");
