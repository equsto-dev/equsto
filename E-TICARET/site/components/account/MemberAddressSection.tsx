"use client";

import { useCallback, useEffect, useState } from "react";
import PfosAdresAutocomplete from "@/components/pfos/public/PfosAdresAutocomplete";
import {
  EMPTY_MEMBER_TESLIMAT_ADRES,
  formatMemberTeslimatAdres,
  isMemberTeslimatAdresComplete,
  normalizeMemberTeslimatAdres,
  type MemberTeslimatAdres,
} from "@/lib/account/member-teslimat-adres";
import { putMemberProfile } from "@/lib/account/member-profile.client";
import type { PfosAdresFormValue } from "@/lib/pfos/adres/tr-adres";
import styles from "./account.module.css";

type Props = {
  value: MemberTeslimatAdres;
  onSaved: (next: MemberTeslimatAdres) => void;
  autoEdit?: boolean;
};

function toFormValue(v: MemberTeslimatAdres): PfosAdresFormValue {
  return { il: v.il, ilce: v.ilce, mahalle: "" };
}

function fromFormValue(form: PfosAdresFormValue, acikAdres: string): MemberTeslimatAdres {
  return {
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
  const complete = isMemberTeslimatAdresComplete(value);
  const [editing, setEditing] = useState(autoEdit || !complete);
  const [form, setForm] = useState<PfosAdresFormValue>(() => toFormValue(value));
  const [acikAdres, setAcikAdres] = useState(value.acikAdres);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) {
      setForm(toFormValue(value));
      setAcikAdres(value.acikAdres);
    }
  }, [value, editing]);

  useEffect(() => {
    if (autoEdit) setEditing(true);
  }, [autoEdit]);

  const startEdit = useCallback(() => {
    setForm(toFormValue(value));
    setAcikAdres(value.acikAdres);
    setError("");
    setEditing(true);
  }, [value]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setError("");
  }, []);

  async function save() {
    const next = fromFormValue(form, acikAdres);
    if (!next.il || !next.ilce) {
      setError("İl ve ilçe zorunludur.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await putMemberProfile({ teslimatAdres: next });
      if (!result.success || !result.user?.teslimatAdres) {
        setError(result.error || "Adres kaydedilemedi.");
        return;
      }
      onSaved(normalizeMemberTeslimatAdres(result.user.teslimatAdres));
      setEditing(false);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section} id="adres-ekle">
      <h2 className={styles.sectionTitle}>Adres ekle</h2>
      <p className={styles.hint}>
        Proje teslimatı ve PFOS nakliye tahmini için kayıtlı adresiniz. PFOS
        teklifinde bu bilgi otomatik kullanılabilir.
      </p>

      {editing ? (
        <div className={styles.addressForm}>
          <div className={styles.addressAdresPick}>
            <PfosAdresAutocomplete
              value={form}
              onChange={setForm}
            />
          </div>
          <label className={styles.addressField}>
            <span className={styles.profileLabel}>Açık adres (cadde, bina, kat)</span>
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
              onClick={() => void save()}
              disabled={saving}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {complete ? (
              <button
                type="button"
                className={styles.phoneCancelBtn}
                onClick={cancelEdit}
                disabled={saving}
              >
                İptal
              </button>
            ) : null}
          </div>
          {error ? (
            <p className={styles.phoneError}>{error}</p>
          ) : (
            <p className={styles.phoneHint}>
              İl ve ilçe zorunludur. Açık adres teslimat ve montaj planlaması için önerilir.
            </p>
          )}
        </div>
      ) : (
        <div className={styles.addressDisplay}>
          <p className={styles.addressSummary}>{formatMemberTeslimatAdres(value)}</p>
          <button type="button" className={styles.phoneEditBtn} onClick={startEdit}>
            {complete ? "Düzenle" : "Adres ekle"}
          </button>
        </div>
      )}
    </section>
  );
}
