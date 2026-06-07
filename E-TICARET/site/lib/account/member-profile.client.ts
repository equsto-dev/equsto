/** Hesabım — tarayıcı üye profil API (equsto-member.js / equsto-auth-client.js) */

export type MemberProfileUser = {
  email: string;
  name: string;
  telefon: string;
  teslimatAdres?: {
    il: string;
    ilce: string;
    acikAdres: string;
  };
  provider: string;
  picture: string;
};

type MemberApiWindow = Window & {
  equstoGetMemberToken?: () => string;
  equstoAuthValidateSession?: () => Promise<boolean>;
  equstoSetMemberActive?: (extra: Record<string, unknown>) => void;
};

export function getMemberToken(): string {
  if (typeof window === "undefined") return "";
  const w = window as MemberApiWindow;
  return w.equstoGetMemberToken?.() || "";
}

/** equsto-member.js yüklenene kadar bekle */
export function waitForMemberApi(maxMs = 10000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (typeof (window as MemberApiWindow).equstoGetMemberToken === "function") {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (typeof (window as MemberApiWindow).equstoGetMemberToken === "function") {
        resolve(true);
        return;
      }
      if (Date.now() - start >= maxMs) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

export async function ensureMemberToken(): Promise<string> {
  await waitForMemberApi();
  let token = getMemberToken();
  if (token) return token;
  const w = window as MemberApiWindow;
  if (typeof w.equstoAuthValidateSession === "function") {
    try {
      await w.equstoAuthValidateSession();
    } catch {
      /* ignore */
    }
    token = getMemberToken();
  }
  return token;
}

export async function fetchMemberProfileRemote(): Promise<MemberProfileUser | null> {
  const token = await ensureMemberToken();
  if (!token) return null;
  const res = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Equsto-Authorization": token,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    success?: boolean;
    user?: MemberProfileUser;
  };
  if (!data.success || !data.user) return null;
  return data.user;
}

export async function putMemberProfile(
  body: Record<string, unknown>,
): Promise<{ success: boolean; user?: MemberProfileUser; error?: string }> {
  const token = await ensureMemberToken();
  if (!token) {
    return {
      success: false,
      error:
        "Oturum doğrulanamadı. Sayfayı yenileyin veya tekrar giriş yapın.",
    };
  }
  const res = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Equsto-Authorization": token,
    },
    body: JSON.stringify({ ...body, token }),
  });
  const data = (await res.json()) as {
    success?: boolean;
    error?: string;
    user?: MemberProfileUser;
  };
  if (!res.ok || !data.success || !data.user) {
    return {
      success: false,
      error: data.error || "Kayıt başarısız. Lütfen tekrar deneyin.",
    };
  }
  const w = window as MemberApiWindow;
  w.equstoSetMemberActive?.({
    ...data.user,
    displayName: data.user.name || data.user.email,
    phone: data.user.telefon,
    token,
  });
  return { success: true, user: data.user };
}
