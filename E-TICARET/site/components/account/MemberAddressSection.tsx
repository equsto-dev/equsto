"use client";

import { useCallback, useEffect, useState } from "react";
import PfosAdresAutocomplete from "@/components/pfos/public/PfosAdresAutocomplete";
import {
  EMPTY_MEMBER_TESLIMAT_ADRES,
  formatMemberTeslimatAdres,
  normalizeMemberAddressBook,
  type MemberTeslimatAdres,
  type MemberAddressBook,
} from "@/lib/account/member-teslimat-adres";
import { putMemberProfile } from "@/lib/account/member-profile.client";
import type { PfosAdresFormValue } from "@/lib/pfos/adres/tr-adres";
import styles from "./account.module.css";

type Props = {
  value: any;
  onSaved: (next: any) => void;
  autoEdit?: boolean;
};

function toFormValue(v: MemberTeslimatAdres): PfosAdresFormValue {
  return { il: v.il, ilce: v.ilce, mahalle: "" };
}

function fromFormValue(form: PfosAdresFormValue, acikAdres: string, title: string, id?: string): MemberTeslimatAdres {
  return {
    id: id || `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim() || "Adresim",
    il: form.il.trim(),
    ilce: form.ilce.trim(),
    acikAdres: acikAdres.trim(),
  };
}

export default function MemberAddressSection({
  value,
  onSaved,
  autoEdit = false,
}: Props) {
  const book = normalizeMemberAddressBook(value);
  const [editing, setEditing] = useState(autoEdit && book.addresses.length === 0);
  const [editId, setEditId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [form, setForm] = useState<PfosAdresFormValue>({ il: "", ilce: "", mahalle: "" });
  const [acikAdres, setAcikAdres] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (autoEdit && book.addresses.length === 0) {
      setEditing(true);
      setEditId(null);
      setTitleInput("Varsayılan Adres");
      setForm({ il: "", ilce: "", mahalle: "" });
      setAcikAdres("");
    }
  }, [autoEdit, book.addresses.length]);

  const startAddNew = useCallback(() => {
    setEditId(null);
    setTitleInput("");
    setForm({ il: "", ilce: "", mahalle: "" });
    setAcikAdres("");
    setError("");
    setEditing(true);
  }, []);

  const startEdit = useCallback((addr: MemberTeslimatAdres) => {
    setEditId(addr.id || "default");
    setTitleInput(addr.title || "Adresim");
    setForm(toFormValue(addr));
    setAcikAdres(addr.acikAdres);
    setError("");
    setEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setEditId(null);
    setError("");
  }, []);

  async function saveAddress() {
    if (!form.il || !form.ilce) {
      setError("İl ve ilçe zorunludur.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const nextAddr = fromFormValue(form, acikAdres, titleInput, editId || undefined);
      
      let nextAddresses = [...book.addresses];
      if (editId) {
        nextAddresses = nextAddresses.map((a) => (a.id === editId ? nextAddr : a));
      } else {
        nextAddresses.push(nextAddr);
      }

      const nextBook: MemberAddressBook = {
        addresses: nextAddresses,
        defaultAddressId: book.defaultAddressId || nextAddr.id || "default",
      };
      if (nextAddresses.length === 1) {
        nextBook.defaultAddressId = nextAddresses[0].id || "default";
      }

      const result = await putMemberProfile({ teslimatAdres: nextBook });
      if (!result.success || !result.user?.teslimatAdres) {
        setError(result.error || "Adres kaydedilemedi.");
        return;
      }
      onSaved(result.user.teslimatAdres);
      setEditing(false);
      setEditId(null);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(id: string) {
    if (confirm("Bu adresi silmek istediğinize emin misiniz?")) {
      setSaving(true);
      try {
        const nextAddresses = book.addresses.filter((a) => a.id !== id);
        let defaultId = book.defaultAddressId;
        if (defaultId === id) {
          defaultId = nextAddresses[0]?.id || "";
        }
        const nextBook: MemberAddressBook = {
          addresses: nextAddresses,
          defaultAddressId: defaultId,
        };

        const result = await putMemberProfile({ teslimatAdres: nextBook });
        if (!result.success || !result.user?.teslimatAdres) {
          alert(result.error || "Adres silinemedi.");
          return;
        }
        onSaved(result.user.teslimatAdres);
      } catch {
        alert("Bağlantı hatası.");
      } finally {
        setSaving(false);
      }
    }
  }

  async function setDefaultAddress(id: string) {
    setSaving(true);
    try {
      const nextBook: MemberAddressBook = {
        addresses: book.addresses,
        defaultAddressId: id,
      };
      const result = await putMemberProfile({ teslimatAdres: nextBook });
      if (!result.success || !result.user?.teslimatAdres) {
        alert(result.error || "Varsayılan adres güncellenemedi.");
        return;
      }
      onSaved(result.user.teslimatAdres);
    } catch {
      alert("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section} id="adres-ekle">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Adres Defterim</h2>
        {!editing && (
          <button type="button" className={styles.phoneEditBtn} onClick={startAddNew}>
            Yeni Adres Ekle
          </button>
        )}
      </div>

      {!editing && book.addresses.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p className={styles.hint} style={{ marginBottom: "12px" }}>
            Kayıtlı teslimat adresiniz bulunmamaktadır. Proje teslimatı ve PFOS nakliye tahmini için adres ekleyin.
          </p>
          <button type="button" className={styles.phoneSaveBtn} onClick={startAddNew}>
            Adres Ekle
          </button>
        </div>
      )}

      {!editing && book.addresses.length > 0 && (
        <div className={styles.addressCards}>
          {book.addresses.map((addr) => {
            const isDefault = addr.id === book.defaultAddressId;
            return (
              <div
                key={addr.id}
                className={`${styles.addressCard} ${isDefault ? styles.addressCardDefault : ""}`}
              >
                <div>
                  <div className={styles.infoCardHead}>
                    <h3 className={styles.infoCardTitle}>
                      {addr.title || "Adres"}
                    </h3>
                    {isDefault ? (
                      <span className={styles.infoCardBadge}>Varsayılan</span>
                    ) : null}
                  </div>
                  <p className={styles.infoCardLine}>
                    {addr.il} / {addr.ilce}
                  </p>
                  <p className={styles.infoCardLineMuted}>{addr.acikAdres}</p>
                </div>

                <div className={styles.infoCardFoot}>
                  <button
                    type="button"
                    className={styles.infoCardAction}
                    onClick={() => startEdit(addr)}
                  >
                    Düzenle
                  </button>
                  {book.addresses.length > 1 ? (
                    <button
                      type="button"
                      className={styles.infoCardAction}
                      style={{ color: "#c0392b" }}
                      onClick={() => void deleteAddress(addr.id || "")}
                      disabled={saving}
                    >
                      Sil
                    </button>
                  ) : null}
                  {!isDefault ? (
                    <button
                      type="button"
                      className={styles.infoCardAction}
                      style={{ marginLeft: "auto", color: "#5c6378" }}
                      onClick={() => void setDefaultAddress(addr.id || "")}
                      disabled={saving}
                    >
                      Varsayılan Yap
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className={styles.addressForm} style={{ marginTop: "12px" }}>
          <label className={styles.addressField} style={{ marginBottom: "12px" }}>
            <span className={styles.profileLabel}>Adres Başlığı (ör. Ev, Ofis, Şantiye)</span>
            <input
              type="text"
              className={styles.phoneInput}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Adres başlığı girin…"
              disabled={saving}
            />
          </label>
          <div className={styles.addressAdresPick}>
            <PfosAdresAutocomplete
              value={form}
              onChange={setForm}
            />
          </div>
          <label className={styles.addressField}>
            <span className={styles.profileLabel}>Açık adres (cadde, sokak, bina no, kat)</span>
            <textarea
              className={styles.addressTextarea}
              value={acikAdres}
              onChange={(e) => setAcikAdres(e.target.value)}
              placeholder="Mahalle, sokak, bina no, daire…"
              rows={3}
              disabled={saving}
            />
          </label>
          <div className={styles.phoneActions}>
            <button
              type="button"
              className={styles.phoneSaveBtn}
              onClick={() => void saveAddress()}
              disabled={saving}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              className={styles.phoneCancelBtn}
              onClick={cancelEdit}
              disabled={saving}
            >
              İptal
            </button>
          </div>
          {error ? (
            <p className={styles.phoneError}>{error}</p>
          ) : (
            <p className={styles.phoneHint}>
              İl, ilçe ve açık adres nakliye tahmini ve sipariş gönderimleri için gereklidir.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
