type MemberRecord = {
  name?: string;
  ad?: string;
  displayName?: string;
  email?: string;
};

/** Üye kaydından kişisel selamlama için ilk ad (veya e-posta öneki). */
export function memberDisplayFirstName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const o = JSON.parse(
      localStorage.getItem("equsto_member_v1") || "null",
    ) as MemberRecord | null;
    const raw = String(
      o?.name || o?.ad || o?.displayName || o?.email || "",
    ).trim();
    if (!raw) return null;
    if (raw.includes("@")) {
      const local = raw.split("@")[0]?.trim();
      if (!local) return null;
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return raw.split(/\s+/)[0] ?? null;
  } catch {
    return null;
  }
}
