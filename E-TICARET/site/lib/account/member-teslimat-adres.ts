/** Üye teslimat adresi — PFOS nakliye / proje teslimatı */

export type MemberTeslimatAdres = {
  il: string;
  ilce: string;
  acikAdres: string;
};

export const EMPTY_MEMBER_TESLIMAT_ADRES: MemberTeslimatAdres = {
  il: "",
  ilce: "",
  acikAdres: "",
};

export function normalizeMemberTeslimatAdres(raw: unknown): MemberTeslimatAdres {
  const o =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return {
    il: String(o.il || "").trim(),
    ilce: String(o.ilce || "").trim(),
    acikAdres: String(o.acikAdres || o.acik_adres || "").trim(),
  };
}

export function isMemberTeslimatAdresComplete(v: MemberTeslimatAdres): boolean {
  return Boolean(v.il.trim() && v.ilce.trim());
}

export function requireValidMemberTeslimatAdres(
  raw: unknown,
): MemberTeslimatAdres {
  const v = normalizeMemberTeslimatAdres(raw);
  if (!v.il.trim() || !v.ilce.trim()) {
    throw new Error("İl ve ilçe zorunludur.");
  }
  return v;
}

export function formatMemberTeslimatAdres(v: MemberTeslimatAdres): string {
  const parts = [v.il, v.ilce, v.acikAdres].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}
