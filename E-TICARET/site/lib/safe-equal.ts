import { timingSafeEqual } from "node:crypto";

/** Uzunluk farkında bile sabit zamanlı string karşılaştırma */
export function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(String(a), "utf8");
  const right = Buffer.from(String(b), "utf8");
  if (left.length !== right.length) {
    // Aynı uzunlukta dummy kıyas — erken return timing sızıntısını azaltır
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
