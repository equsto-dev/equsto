"use client";

import { useCallback, useEffect, useState } from "react";
import AccountCardIcon from "@/components/account/AccountCardIcon";
import {
  ACCOUNT_CARDS,
  ACCOUNT_LINK_COLUMNS,
} from "@/lib/account/account-hub";
import {
  memberLoggedInNow,
  pfosLoginHref,
} from "@/lib/pfos/member-session.client";
import styles from "./account.module.css";

type MemberProfile = {
  email: string;
  name: string;
  telefon: string;
  provider: string;
  picture: string;
};

type EqustoMemberWindow = Window & {
  equstoGetMemberToken?: () => string;
  equstoAuthLogout?: () => Promise<unknown>;
  equstoClearMemberSession?: () => void;
  equstoShowWhatsAppModal?: () => void;
  equstoSetMemberActive?: (extra: Record<string, string>) => void;
};

function readLocalProfile(): Partial<MemberProfile> {
  try {
    const o = JSON.parse(
      localStorage.getItem("equsto_member_v1") || "null",
    ) as Record<string, string> | null;
    if (!o) return {};
    return {
      email: o.email || "",
      name: o.displayName || o.name || "",
      telefon: o.telefon || o.phone || "",
      provider: o.provider || "",
      picture: o.picture || "",
    };
  } catch {
    return {};
  }
}

async function fetchMemberProfile(): Promise<MemberProfile | null> {
  const w = window as EqustoMemberWindow;
  const token = w.equstoGetMemberToken?.() || "";
  if (!token) return null;

  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    success?: boolean;
    user?: MemberProfile;
  };
  if (!data.success || !data.user) return null;
  return data.user;
}

function formatPhone(t: string) {
  const d = String(t || "").replace(/\D/g, "");
  if (d.length === 10) {
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }
  return t || "—";
}

export default function MemberAccountHub() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const load = useCallback(async () => {
    if (!memberLoggedInNow()) {
      window.location.href = pfosLoginHref();
      return;
    }
    const remote = await fetchMemberProfile();
    const local = readLocalProfile();
    if (remote) {
      setProfile(remote);
    } else if (local.email) {
      setProfile({
        email: local.email || "",
        name: local.name || "",
        telefon: local.telefon || "",
        provider: local.provider || "",
        picture: local.picture || "",
      });
    } else {
      window.location.href = pfosLoginHref();
      return;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
    const onSession = () => void load();
    document.addEventListener("equsto-member-session", onSession);
    document.addEventListener("equsto-member-changed", onSession);
    return () => {
      document.removeEventListener("equsto-member-session", onSession);
      document.removeEventListener("equsto-member-changed", onSession);
    };
  }, [load]);

  function onCardClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    action?: "whatsapp",
  ) {
    if (action !== "whatsapp") return;
    e.preventDefault();
    const w = window as EqustoMemberWindow;
    if (typeof w.equstoShowWhatsAppModal === "function") {
      w.equstoShowWhatsAppModal();
      return;
    }
    window.location.href = "/contact";
  }

  async function onLogout() {
    const w = window as EqustoMemberWindow;
    try {
      if (typeof w.equstoAuthLogout === "function") await w.equstoAuthLogout();
      else w.equstoClearMemberSession?.();
    } catch {
      w.equstoClearMemberSession?.();
    }
    window.location.href = "/login";
  }

  function startPhoneEdit() {
    setPhoneInput(profile?.telefon || "");
    setPhoneError("");
    setPhoneEditing(true);
  }

  function cancelPhoneEdit() {
    setPhoneEditing(false);
    setPhoneError("");
  }

  async function savePhone() {
    const w = window as EqustoMemberWindow;
    const token = w.equstoGetMemberToken?.() || "";
    if (!token) {
      window.location.href = pfosLoginHref();
      return;
    }
    setPhoneSaving(true);
    setPhoneError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ telefon: phoneInput.trim() }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        user?: MemberProfile;
      };
      if (!res.ok || !data.success || !data.user) {
        setPhoneError(data.error || "Telefon kaydedilemedi.");
        return;
      }
      setProfile((prev) => (prev ? { ...prev, telefon: data.user!.telefon } : prev));
      w.equstoSetMemberActive?.({
        telefon: data.user.telefon,
        phone: data.user.telefon,
      });
      setPhoneEditing(false);
    } catch {
      setPhoneError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setPhoneSaving(false);
    }
  }

  if (!ready || !profile) {
    return <div className={styles.loading}>Hesabınız yükleniyor…</div>;
  }

  const displayName =
    profile.name?.trim() || profile.email.split("@")[0] || "Üye";

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>Hesabım</h1>
        <p className={styles.greeting}>Merhaba, {displayName}</p>
      </header>

      <div className={styles.grid}>
        {ACCOUNT_CARDS.map((card) => (
          <a
            key={card.id}
            href={card.href}
            className={styles.card}
            onClick={(e) => onCardClick(e, card.action)}
          >
            <span className={styles.cardIcon}>
              <AccountCardIcon kind={card.icon} />
            </span>
            <span className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{card.title}</h2>
              <p className={styles.cardDesc}>{card.description}</p>
            </span>
          </a>
        ))}
      </div>

      <section className={styles.section} id="guvenlik">
        <h2 className={styles.sectionTitle}>Giriş ve güvenlik</h2>
        <div className={styles.profileGrid}>
          <div>
            <span className={styles.profileLabel}>Ad Soyad</span>
            <span className={styles.profileValue}>{profile.name || "—"}</span>
          </div>
          <div>
            <span className={styles.profileLabel}>E-posta</span>
            <span className={styles.profileValue}>{profile.email}</span>
          </div>
          <div className={styles.phoneField}>
            <span className={styles.profileLabel}>Cep telefonu</span>
            {phoneEditing ? (
              <div className={styles.phoneForm}>
                <input
                  type="tel"
                  className={styles.phoneInput}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="5xx xxx xx xx"
                  autoComplete="tel"
                  inputMode="tel"
                  disabled={phoneSaving}
                />
                <div className={styles.phoneActions}>
                  <button
                    type="button"
                    className={styles.phoneSaveBtn}
                    onClick={() => void savePhone()}
                    disabled={phoneSaving}
                  >
                    {phoneSaving ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                  <button
                    type="button"
                    className={styles.phoneCancelBtn}
                    onClick={cancelPhoneEdit}
                    disabled={phoneSaving}
                  >
                    İptal
                  </button>
                </div>
                {phoneError ? (
                  <p className={styles.phoneError}>{phoneError}</p>
                ) : (
                  <p className={styles.phoneHint}>
                    PFOS teklif PDF&apos;i ve WhatsApp gönderimi için kullanılır.
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.phoneDisplay}>
                <span className={styles.profileValue}>
                  {formatPhone(profile.telefon)}
                </span>
                <button
                  type="button"
                  className={styles.phoneEditBtn}
                  onClick={startPhoneEdit}
                >
                  {profile.telefon ? "Düzenle" : "Ekle"}
                </button>
              </div>
            )}
          </div>
          <div>
            <span className={styles.profileLabel}>Giriş yöntemi</span>
            <span className={styles.profileValue}>
              {profile.provider === "google"
                ? "Google"
                : profile.provider === "email"
                  ? "E-posta"
                  : profile.provider || "—"}
            </span>
          </div>
        </div>
        <button type="button" className={styles.logoutBtn} onClick={() => void onLogout()}>
          Çıkış yap
        </button>
      </section>

      <section className={styles.section} id="teslimat">
        <h2 className={styles.sectionTitle}>Teslimat adresi</h2>
        <p className={styles.hint}>
          Proje teslimatı ve PFOS nakliye tahmini için adres bilgisi sihirbaz
          içinde veya sepet/checkout adımında güncellenir. PFOS teklifi
          oluştururken adres adımını doldurmanız yeterlidir.
        </p>
        <p className={styles.hint} style={{ marginTop: 12 }}>
          <a href="/pfos">Proje Fabrikası&apos;na git →</a>
        </p>
      </section>

      <div className={styles.linkColumns}>
        {ACCOUNT_LINK_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className={styles.colTitle}>{col.title}</h3>
            <ul className={styles.colLinks}>
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}

declare global {
  interface Window {
    equstoShowWhatsAppModal?: () => void;
  }
}
