"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  filterDistricts,
  filterNeighborhoods,
  filterProvinces,
  findDistrictByName,
  findProvinceByName,
  loadTrAdres,
  type PfosAdresFormValue,
} from "@/lib/pfos/adres/tr-adres";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import styles from "./pfos-public.module.css";

type FieldProps = {
  fieldKey: string;
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  disabled?: boolean;
  suggestions: string[];
  open: boolean;
  onOpen: (open: boolean) => void;
  onChange: (value: string) => void;
  onPick: (value: string) => void;
};

function AutocompleteField({
  fieldKey,
  label,
  required,
  placeholder,
  value,
  disabled,
  suggestions,
  open,
  onOpen,
  onChange,
  onPick,
}: FieldProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlight, setHighlight] = useState(0);
  const inputName = `pfos_${fieldKey}_${listId.replace(/:/g, "")}`;

  function armInput(el: HTMLInputElement | null) {
    if (el) el.readOnly = false;
  }

  function disarmInput(el: HTMLInputElement | null) {
    if (el) el.readOnly = true;
  }

  useEffect(() => {
    setHighlight(0);
  }, [suggestions, open]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions[highlight]) {
      e.preventDefault();
      onPick(suggestions[highlight]!);
    } else if (e.key === "Escape") {
      onOpen(false);
    }
  }

  return (
    <label className={styles.fieldLabel}>
      {label}
      {required ? " *" : ""}
      <div className={styles.acWrap}>
        <input
          ref={inputRef}
          className={styles.textInput}
          type="text"
          name={inputName}
          id={inputName}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          readOnly
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore
          data-bwignore
          data-form-type="other"
          enterKeyHint="next"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          onMouseDown={() => armInput(inputRef.current)}
          onTouchStart={() => armInput(inputRef.current)}
          onChange={(e) => {
            onChange(e.target.value);
            onOpen(true);
          }}
          onFocus={(e) => {
            armInput(e.currentTarget);
            onOpen(true);
          }}
          onBlur={(e) => {
            disarmInput(e.currentTarget);
            setTimeout(() => onOpen(false), 160);
          }}
          onKeyDown={onKeyDown}
        />
        {open && suggestions.length > 0 ? (
          <div className={styles.acList} id={listId} role="listbox">
            {suggestions.map((item, i) => (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={`${styles.acItem}${i === highlight ? ` ${styles.acItemHl}` : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(item);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  );
}

type Props = {
  value: PfosAdresFormValue;
  onChange: (value: PfosAdresFormValue) => void;
};

export default function PfosAdresAutocomplete({
  value,
  onChange,
}: Props) {
  const { t } = usePfosLabel();
  const [ready, setReady] = useState(false);
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [openField, setOpenField] = useState<"il" | "ilce" | "mahalle" | null>(
    null,
  );

  useEffect(() => {
    void loadTrAdres().then(setReady);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const p = findProvinceByName(value.il);
    setProvinceId(p?.id ?? null);
    const d = p ? findDistrictByName(p.id, value.ilce) : null;
    setDistrictId(d?.id ?? null);
  }, [ready, value.il, value.ilce]);

  const patch = useCallback(
    (patch: Partial<PfosAdresFormValue>) => {
      onChange({ ...value, ...patch });
    },
    [onChange, value],
  );

  const ilSuggestions = filterProvinces(value.il).map((p) => p.name);
  const ilceSuggestions =
    provinceId != null
      ? filterDistricts(provinceId, value.ilce).map((d) => d.name)
      : [];
  const mahalleSuggestions =
    districtId != null
      ? filterNeighborhoods(districtId, value.mahalle)
      : [];

  function pickIl(name: string) {
    const p = findProvinceByName(name);
    setProvinceId(p?.id ?? null);
    setDistrictId(null);
    patch({ il: p?.name ?? name, ilce: "", mahalle: "" });
    setOpenField(null);
  }

  function pickIlce(name: string) {
    if (provinceId == null) {
      const p = findProvinceByName(value.il);
      if (p) setProvinceId(p.id);
    }
    const pid = provinceId ?? findProvinceByName(value.il)?.id;
    const d = pid != null ? findDistrictByName(pid, name) : null;
    setDistrictId(d?.id ?? null);
    patch({ ilce: d?.name ?? name, mahalle: "" });
    setOpenField(null);
  }

  function pickMahalle(name: string) {
    patch({ mahalle: name });
    setOpenField(null);
  }

  return (
    <form
      className={styles.adresGrid}
      autoComplete="off"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Chrome adres otofill tuzağı — gerçek alanlar aşağıda */}
      <div className={styles.adresAutofillTrap} aria-hidden="true">
        <input
          type="text"
          name="pfos_trap_street"
          autoComplete="street-address"
          tabIndex={-1}
          defaultValue=""
        />
        <input
          type="text"
          name="pfos_trap_city"
          autoComplete="address-level2"
          tabIndex={-1}
          defaultValue=""
        />
      </div>
      {!ready ? (
        <p className={styles.questionNote}>{t("Adres listesi yükleniyor…")}</p>
      ) : null}

      <AutocompleteField
        fieldKey="il"
        label={t("İl (şehir)")}
        required
        placeholder={t("Yazmaya başlayın — örn. İstanbul")}
        value={value.il}
        suggestions={ilSuggestions}
        open={openField === "il"}
        onOpen={(o) => setOpenField(o ? "il" : null)}
        onChange={(il) => {
          const prevP = findProvinceByName(value.il);
          const nextP = findProvinceByName(il);
          setProvinceId(nextP?.id ?? null);
          if (prevP?.id !== nextP?.id) {
            patch({ il, ilce: "", mahalle: "" });
          } else {
            patch({ il });
          }
        }}
        onPick={pickIl}
      />

      <AutocompleteField
        fieldKey="ilce"
        label="İlçe"
        required
        placeholder={
          provinceId != null
            ? "Listeden seçin veya yazın"
            : "Önce il seçin"
        }
        value={value.ilce}
        disabled={!value.il.trim()}
        suggestions={ilceSuggestions}
        open={openField === "ilce"}
        onOpen={(o) => setOpenField(o ? "ilce" : null)}
        onChange={(ilce) => {
          if (provinceId == null) {
            const p = findProvinceByName(value.il);
            if (p) setProvinceId(p.id);
          }
          const pid = provinceId ?? findProvinceByName(value.il)?.id;
          const d =
            pid != null ? findDistrictByName(pid, ilce) : null;
          setDistrictId(d?.id ?? null);
          patch({ ilce, mahalle: d ? "" : value.mahalle });
        }}
        onPick={pickIlce}
      />

      <AutocompleteField
        fieldKey="mahalle"
        label={t("Mahalle")}
        placeholder={
          districtId != null
            ? t("Listeden seçin (opsiyonel)")
            : t("Önce ilçe seçin")
        }
        value={value.mahalle}
        disabled={!value.ilce.trim()}
        suggestions={mahalleSuggestions}
        open={openField === "mahalle"}
        onOpen={(o) => setOpenField(o ? "mahalle" : null)}
        onChange={(mahalle) => patch({ mahalle })}
        onPick={pickMahalle}
      />

      {provinceId != null && value.ilce && !districtId ? (
        <p className={styles.adresWarn}>
          {t("İlçe listeden eşleşmedi — yine de devam edebilirsiniz.")}
        </p>
      ) : null}
    </form>
  );
}
