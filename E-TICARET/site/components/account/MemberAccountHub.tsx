"use client";

import { useCallback, useEffect, useState } from "react";
import MemberAddressSection from "@/components/account/MemberAddressSection";
import AccountCardIcon from "@/components/account/AccountCardIcon";
import {
  ACCOUNT_CARDS,
  ACCOUNT_LINK_COLUMNS,
} from "@/lib/account/account-hub";
import {
  EMPTY_MEMBER_TESLIMAT_ADRES,
  normalizeMemberTeslimatAdres,
  normalizeMemberAddressBook,
  type MemberTeslimatAdres,
  type MemberAddressBook,
} from "@/lib/account/member-teslimat-adres";
import {
  ensureMemberToken,
  fetchMemberProfileRemote,
  putMemberProfile,
  waitForMemberApi,
  fetchMemberDashboardRemote,
} from "@/lib/account/member-profile.client";
import {
  memberLoggedInNow,
  pfosLoginHref,
} from "@/lib/pfos/member-session.client";
import styles from "./account.module.css";

type MemberProfile = {
  email: string;
  name: string;
  telefon: string;
  teslimatAdres: any;
  provider: string;
  picture: string;
};

type EqustoMemberWindow = Window & {
  equstoGetMemberToken?: () => string;
  equstoAuthLogout?: () => Promise<unknown>;
  equstoClearMemberSession?: () => void;
  equstoShowWhatsAppModal?: () => void;
  equstoSetMemberActive?: (extra: Record<string, unknown>) => void;
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
      teslimatAdres: normalizeMemberTeslimatAdres(o.teslimatAdres),
      provider: o.provider || "",
      picture: o.picture || "",
    };
  } catch {
    return {};
  }
}

async function fetchMemberProfile(): Promise<MemberProfile | null> {
  const user = await fetchMemberProfileRemote();
  if (!user) return null;
  return {
    email: user.email,
    name: user.name,
    telefon: user.telefon,
    teslimatAdres: normalizeMemberTeslimatAdres(user.teslimatAdres),
    provider: user.provider,
    picture: user.picture,
  };
}

function hasValidTrPhone(t: string) {
  let d = String(t || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 12 && d.startsWith("90")) d = d.slice(2);
  return d.length === 10 && d.startsWith("5");
}

function formatPhone(t: string) {
  const d = String(t || "").replace(/\D/g, "");
  if (d.length === 10) {
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }
  return t || "—";
}

function providerLabel(provider: string) {
  if (provider === "google") return "Google";
  if (provider === "email") return "E-posta";
  return provider || "—";
}

export default function MemberAccountHub() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [addressAutoEdit, setAddressAutoEdit] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const load = useCallback(async () => {
    await waitForMemberApi();
    if (!memberLoggedInNow()) {
      window.location.href = pfosLoginHref();
      return;
    }
    const token = await ensureMemberToken();
    if (!token) {
      const w = window as EqustoMemberWindow;
      if (memberLoggedInNow()) {
        w.equstoClearMemberSession?.();
      }
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
        teslimatAdres: local.teslimatAdres || EMPTY_MEMBER_TESLIMAT_ADRES,
        provider: local.provider || "",
        picture: local.picture || "",
      });
    } else {
      window.location.href = pfosLoginHref();
      return;
    }
    
    // Load orders and quotes history
    try {
      setLoadingHistory(true);
      const history = await fetchMemberDashboardRemote();
      if (history) {
        setOrders(history.orders || []);
        setQuotes(history.quotes || []);
      }
    } catch (err) {
      console.error("Dashboard history load error:", err);
    } finally {
      setLoadingHistory(false);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    void load();
    const onSession = () => {
      if (!ready) void load();
    };
    document.addEventListener("equsto-member-session", onSession);
    document.addEventListener("equsto-member-changed", onSession);
    return () => {
      document.removeEventListener("equsto-member-session", onSession);
      document.removeEventListener("equsto-member-changed", onSession);
    };
  }, [load, ready]);

  useEffect(() => {
    if (!ready) return;
    function focusAddressSection() {
      const hash = window.location.hash.replace("#", "");
      if (hash === "adres-ekle" || hash === "teslimat") {
        const el = document.getElementById("adres-ekle");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        setAddressAutoEdit(true);
      } else if (hash === "siparislerim") {
        const el = document.getElementById("siparislerim");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (hash === "tekliflerim") {
        const el = document.getElementById("tekliflerim");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    focusAddressSection();
    window.addEventListener("hashchange", focusAddressSection);
    return () => window.removeEventListener("hashchange", focusAddressSection);
  }, [ready]);

  useEffect(() => {
    if (!ready || !profile) return;
    if (!hasValidTrPhone(profile.telefon)) {
      setPhoneInput(profile.telefon || "");
      setPhoneEditing(true);
      const el = document.getElementById("guvenlik");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ready, profile]);

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
    window.location.href = "/iletisim";
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
    setPhoneSaving(true);
    setPhoneError("");
    try {
      const result = await putMemberProfile({ telefon: phoneInput.trim() });
      if (!result.success || !result.user) {
        setPhoneError(result.error || "Telefon kaydedilemedi.");
        return;
      }
      setProfile((prev) =>
        prev ? { ...prev, telefon: result.user!.telefon } : prev,
      );
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
  const phoneMissing = !hasValidTrPhone(profile.telefon);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Hesabım</h1>
          <p className={styles.greeting}>Merhaba, {displayName}</p>
        </div>
        {phoneMissing ? (
          <div className={styles.phoneRequiredBanner} role="alert">
            <strong>Cep telefonu gerekli.</strong> WhatsApp mesajları ve teklif
            gönderimi için lütfen aşağıdaki alana geçerli bir numara girin (5xx xxx
            xx xx).
          </div>
        ) : null}
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

      <div className={styles.profileRow}>
        <div className={styles.profileCol} id="guvenlik">
          <div className={styles.infoCard}>
            <div>
              <div className={styles.infoCardHead}>
                <h3 className={styles.infoCardTitle}>Giriş ve güvenlik</h3>
                <span className={styles.infoCardBadge}>
                  {providerLabel(profile.provider)}
                </span>
              </div>
              <p className={styles.infoCardMeta}>{profile.name || "—"}</p>
              <p className={styles.infoCardLine}>{profile.email}</p>
              {phoneEditing ? (
                <div className={styles.infoCardPhoneForm}>
                  <span className={styles.profileLabel}>Cep telefonu</span>
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
                      WhatsApp mesajları, PFOS teklif PDF&apos;i ve Equsto ekibinin
                      size dönüş yapması için zorunludur.
                    </p>
                  )}
                </div>
              ) : (
                <p className={styles.infoCardLineMuted}>
                  {formatPhone(profile.telefon)}
                </p>
              )}
            </div>
            <div className={styles.infoCardFoot}>
              {!phoneEditing ? (
                <button
                  type="button"
                  className={styles.infoCardAction}
                  onClick={startPhoneEdit}
                >
                  {profile.telefon ? "Telefonu düzenle" : "Telefon ekle"}
                </button>
              ) : null}
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={() => void onLogout()}
              >
                Çıkış yap
              </button>
            </div>
          </div>
        </div>

        <div className={styles.profileCol}>
          <MemberAddressSection
            value={profile.teslimatAdres || EMPTY_MEMBER_TESLIMAT_ADRES}
            autoEdit={addressAutoEdit}
            onSaved={(teslimatAdres) =>
              setProfile((prev) => (prev ? { ...prev, teslimatAdres } : prev))
            }
          />
        </div>
      </div>

      {/* Siparişlerim Section */}
      <section className={styles.section} id="siparislerim">
        <h2 className={styles.sectionTitle}>Siparişlerim / Taleplerim</h2>
        {loadingHistory ? (
          <div className={styles.hint}>Siparişler yükleniyor…</div>
        ) : orders.length === 0 ? (
          <p className={styles.hint}>Henüz sipariş talebiniz bulunmuyor.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #dde1ea", textAlign: "left" }}>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Sipariş No</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Tarih</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Kalem / Adet</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Durum</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378", textAlign: "right" }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("tr-TR") : "—";
                  return (
                    <tr key={order.id} style={{ borderBottom: "1px solid #dde1ea" }}>
                      <td style={{ padding: "12px 10px", fontSize: "0.88rem", fontWeight: "600", color: "#001e50" }}>
                        {order.siparisNo || order.id}
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "#5c6378" }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "#1a1d2b" }}>
                        {order.toplamKalem || 0} Kalem / {order.toplamAdet || 0} Adet
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.85rem" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: order.durum === "teslim" ? "#e6f4ea" : order.durum === "beklemede" ? "#fff8e6" : "#eef3fb",
                          color: order.durum === "teslim" ? "#137333" : order.durum === "beklemede" ? "#b06000" : "#001e50",
                        }}>
                          {order.durum}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.88rem", fontWeight: "600", color: "#1a1d2b", textAlign: "right" }}>
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(order.toplamTl || 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Teklif Havuzum Section */}
      <section className={styles.section} id="tekliflerim">
        <h2 className={styles.sectionTitle}>Proje Fabrikası (PFOS) Tekliflerim</h2>
        {loadingHistory ? (
          <div className={styles.hint}>Teklifler yükleniyor…</div>
        ) : quotes.length === 0 ? (
          <p className={styles.hint}>Henüz Proje Fabrikası teklifiniz bulunmuyor.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #dde1ea", textAlign: "left" }}>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Teklif No</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Tarih</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Konsept</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378" }}>Durum</th>
                  <th style={{ padding: "10px", fontSize: "0.82rem", color: "#5c6378", textAlign: "right" }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const dateStr = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("tr-TR") : "—";
                  return (
                    <tr key={quote.id} style={{ borderBottom: "1px solid #dde1ea" }}>
                      <td style={{ padding: "12px 10px", fontSize: "0.88rem", fontWeight: "600", color: "#001e50" }}>
                        {quote.refNo}
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "#5c6378" }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.85rem", color: "#1a1d2b" }}>
                        {quote.konsept || "Mutfak Tasarımı"}
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.85rem" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          background: quote.durum === "onaylandi" ? "#e6f4ea" : quote.durum === "taslak" ? "#eef3fb" : "#fff8e6",
                          color: quote.durum === "onaylandi" ? "#137333" : quote.durum === "taslak" ? "#001e50" : "#b06000",
                        }}>
                          {quote.durum}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: "0.88rem", fontWeight: "600", color: "#1a1d2b", textAlign: "right" }}>
                        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(quote.toplamTl || 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className={styles.linkColumns}>
        {ACCOUNT_LINK_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className={styles.colTitle}>{col.title}</h3>
            <ul className={styles.colLinks}>
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.action === "logout" ? (
                    <button
                      type="button"
                      className={styles.colLogout}
                      onClick={() => void onLogout()}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a href={link.href}>{link.label}</a>
                  )}
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
