const TR_MAP: Record<string, string> = {
  ğ: "g",
  ü: "u",
  ş: "s",
  ı: "i",
  ö: "o",
  ç: "c",
  Ğ: "g",
  Ü: "u",
  Ş: "s",
  İ: "i",
  Ö: "o",
  Ç: "c",
  â: "a",
  î: "i",
  û: "u",
};

export function slugifyTr(input: string): string {
  let s = String(input || "").trim();
  for (const [from, to] of Object.entries(TR_MAP)) {
    s = s.split(from).join(to);
  }
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
