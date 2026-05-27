import { readFileSync } from "fs";
import { inferUrunTipiFromReferansSatir } from "../lib/pfos/referans/infer-urun-tipi";
import { resolveTipKodu } from "../lib/pfos/core/tip-kodu";

const raw = JSON.parse(
  readFileSync("public/data/pfos-referans/coffee-shop-referans.json", "utf8"),
);
for (const s of raw.kalemler) {
  const tip = inferUrunTipiFromReferansSatir(s);
  console.log(s.poz, s.ad.slice(0, 45), "->", tip, "=>", resolveTipKodu(tip));
}
