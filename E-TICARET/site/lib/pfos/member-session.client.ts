type EqustoMemberRecord = {
  active?: boolean;
  expiresAt?: number | null;
};

type EqustoMemberWindow = Window & {
  equstoIsMemberLoggedIn?: () => boolean;
};

/** Tarayıcı üye oturumu — equsto-member.js yüklenmeden önce localStorage yedek okur */
export function memberLoggedInNow(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as EqustoMemberWindow;
  if (typeof w.equstoIsMemberLoggedIn === "function") {
    return Boolean(w.equstoIsMemberLoggedIn());
  }
  try {
    const o = JSON.parse(
      localStorage.getItem("equsto_member_v1") || "null",
    ) as EqustoMemberRecord | null;
    if (!o || o.active !== true) return false;
    if (o.expiresAt && Number(o.expiresAt) < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/** Giriş sonrası PFOS'a geri dönmek için login URL */
export function pfosLoginHref(): string {
  if (typeof window === "undefined") return "/login";
  const path = window.location.pathname + window.location.search;
  return `/login?next=${encodeURIComponent(path)}`;
}
