import { referansKatalogUyumsuz } from "../lib/pfos/referans/referans-eslestirme.ts";

const s = "İKİ KATLI EKMEK FIRINI, TAŞ TABANLI fimak 1 14000 [object Object]";
const kAd = "Atalay ABS - 10 220-240 V 490 x 100 x 600";
const kSku = "ABS-10";

const res = referansKatalogUyumsuz(s, kAd, "40*60", kSku);
console.log("referansKatalogUyumsuz result:", res);
console.log("norm s:", s.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i"));
console.log("norm k:", (`${kAd} ${kSku ?? ""}`).toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i"));
console.log("firin test on s:", /firin|fırın/.test(s.toLowerCase()));
console.log("firin test on k:", /firin|fırın|kuzine|ocak/.test(kAd.toLowerCase()));
console.log("abs test on kSku:", /abs-\d+/i.test(kSku));
