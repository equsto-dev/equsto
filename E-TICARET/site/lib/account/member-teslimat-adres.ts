/** Üye teslimat adresi — PFOS nakliye / proje teslimatı */

export type MemberTeslimatAdres = {
  id?: string;
  title?: string;
  il: string;
  ilce: string;
  acikAdres: string;
};

export type MemberAddressBook = {
  addresses: MemberTeslimatAdres[];
  defaultAddressId: string;
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
  
  if (Array.isArray(o.addresses)) {
    const defaultId = o.defaultAddressId;
    const defaultAddr = o.addresses.find((a: any) => a.id === defaultId) || o.addresses[0];
    if (defaultAddr) {
      return {
        id: String(defaultAddr.id || "default"),
        title: String(defaultAddr.title || "Varsayılan"),
        il: String(defaultAddr.il || "").trim(),
        ilce: String(defaultAddr.ilce || "").trim(),
        acikAdres: String(defaultAddr.acikAdres || defaultAddr.acik_adres || "").trim(),
      };
    }
  }

  return {
    id: String(o.id || "default"),
    title: String(o.title || "Varsayılan"),
    il: String(o.il || "").trim(),
    ilce: String(o.ilce || "").trim(),
    acikAdres: String(o.acikAdres || o.acik_adres || "").trim(),
  };
}

export function normalizeMemberAddressBook(raw: unknown): MemberAddressBook {
  const o =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  
  if (Array.isArray(o.addresses)) {
    const list = o.addresses.map((a: any, idx: number) => ({
      id: String(a.id || `addr-${idx}-${Date.now()}`),
      title: String(a.title || `Adres ${idx + 1}`),
      il: String(a.il || "").trim(),
      ilce: String(a.ilce || "").trim(),
      acikAdres: String(a.acikAdres || a.acik_adres || "").trim(),
    }));
    return {
      addresses: list,
      defaultAddressId: String(o.defaultAddressId || list[0]?.id || ""),
    };
  }

  const single = normalizeMemberTeslimatAdres(raw);
  if (!single.il && !single.ilce) {
    return { addresses: [], defaultAddressId: "" };
  }
  return {
    addresses: [
      {
        id: "default",
        title: single.title || "Varsayılan Adres",
        il: single.il,
        ilce: single.ilce,
        acikAdres: single.acikAdres,
      },
    ],
    defaultAddressId: "default",
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
