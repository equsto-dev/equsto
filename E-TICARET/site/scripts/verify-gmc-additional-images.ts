/**
 * GMC images-per-offer — hızlı doğrulama
 *   cd E-TICARET/site && npx tsx scripts/verify-gmc-additional-images.ts
 */
import {
  collectGmcPhotoRels,
  expandOfferImageUrls,
  sanitizeGmcSourceRel,
} from "@/lib/gmc-additional-images";
import { buildGoogleMerchantXml, type MerchantFeedItem } from "@/lib/google-merchant-feed";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const photos = collectGmcPhotoRels([
  "images/catalog/ozti/web/ozti-demo.jpg",
  "images/catalog/ozti/web/ozti-demo.svg",
  "prosogutma-market/x/foo.pdf",
  "images/catalog/ozti/web/ozti-demo-2.jpg",
]);
assert(photos.length === 2, `expected 2 photos, got ${photos.length}`);

const origin = "https://equsto.com";
const expanded = expandOfferImageUrls(["images/catalog/ozti/web/ozti-demo.jpg"], origin);
assert(expanded.imageLink.includes("ozti-demo"), "hero missing");
assert(expanded.additionalImageLinks.length >= 3, "synthetic additional missing");
assert(
  expanded.additionalImageLinks.every((u) => u.includes("/api/gmc/img/")),
  "synthetic urls should hit crop API",
);

assert(sanitizeGmcSourceRel("../etc/passwd") === "", "path traversal");
assert(sanitizeGmcSourceRel("https://evil.test/x.jpg") === "", "ssrf absolute");
assert(
  sanitizeGmcSourceRel("images/catalog/ozti/web/ozti-demo.jpg") ===
    "images/catalog/ozti/web/ozti-demo.jpg",
  "valid rel",
);

const item: MerchantFeedItem = {
  id: "DEMO",
  title: "Demo",
  description: "Demo ürün",
  link: `${origin}/shop/hazirlik/demo`,
  imageLink: expanded.imageLink,
  additionalImageLinks: expanded.additionalImageLinks,
  priceTry: 100,
  brand: "Equsto",
  mpn: "DEMO",
  availability: "in stock",
  productType: "demo",
  productDetails: [],
};
const xml = buildGoogleMerchantXml([item], origin);
assert(xml.includes("<g:additional_image_link>"), "xml additional_image_link");
assert((xml.match(/<g:additional_image_link>/g) || []).length >= 3, "xml count");

console.log(
  JSON.stringify(
    {
      ok: true,
      photoRels: photos.length,
      additional: expanded.additionalImageLinks.length,
      sample: expanded.additionalImageLinks[0],
    },
    null,
    2,
  ),
);
