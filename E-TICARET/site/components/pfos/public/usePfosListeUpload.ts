"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import { fetchTcmbKurForTeklif } from "@/lib/pfos/teklif/fetch-kur.client";
import { pfosResponseToTeklifV14 } from "@/lib/pfos/teklif/map-pfos-response";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import {
  memberLoggedInNow,
  pfosLoginHref,
  pfosRegisterHref,
} from "@/lib/pfos/member-session.client";
import { usePfosLabel } from "@/lib/pfos/use-pfos-label";
import { readFetchJsonOrError } from "@/lib/pfos/fetch-json.client";
import { logPfosQuoteGenerated } from "@/lib/pfos/log-pfos-usage.client";

export function fileKind(file: File): "excel" | "pdf" | null {
  if (/\.xlsx?$/i.test(file.name)) return "excel";
  if (/\.pdf$/i.test(file.name)) return "pdf";
  return null;
}

export function usePfosListeUpload() {
  const { t } = usePfosLabel();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loadingKind, setLoadingKind] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<PFOSResponse | null>(null);
  const [teklifV14, setTeklifV14] = useState<TeklifModelV14 | null>(null);
  const [memberReady, setMemberReady] = useState(false);
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");
  const [registerHref, setRegisterHref] = useState("/login?mode=register");

  useEffect(() => {
    const syncMember = () => setMemberLoggedIn(memberLoggedInNow());
    syncMember();
    setLoginHref(pfosLoginHref());
    setRegisterHref(pfosRegisterHref());
    setMemberReady(true);
    document.addEventListener("equsto-member-session", syncMember);
    document.addEventListener("equsto-member-changed", syncMember);
    return () => {
      document.removeEventListener("equsto-member-session", syncMember);
      document.removeEventListener("equsto-member-changed", syncMember);
    };
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setSonuc(null);
    setTeklifV14(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const priceFile = useCallback(
    async (f: File) => {
      const kind = fileKind(f);
      if (!kind) {
        setError(t("Yalnızca Excel (.xlsx) veya PDF (.pdf) desteklenir."));
        return;
      }

      setFile(f);
      setLoadingKind(kind);
      setError(null);
      setSonuc(null);
      setTeklifV14(null);

      try {
        const form = new FormData();
        form.append("file", f);
        form.append("projeAdi", f.name.replace(/\.xlsx?$/i, ""));

        const endpoint =
          kind === "pdf" ? "/api/pfos/parse-upload" : "/api/pfos/liste-fiyat";
        const res = await fetch(endpoint, {
          method: "POST",
          body: form,
        });
        const pfos = await readFetchJsonOrError<PFOSResponse>(
          res,
          t("Sunucu boş yanıt döndü. Lütfen tekrar deneyin."),
          t("Sunucu yanıtı okunamadı. Bağlantınızı kontrol edin."),
          t("Liste fiyatlandırılamadı"),
        );
        setSonuc(pfos);
        const snap = await fetchTcmbKurForTeklif();
        const v14 = pfosResponseToTeklifV14(pfos, {
          projeAdi: pfos.konseptLabel,
          musteri: "",
          teslimatAdresi: pfos.sehir ?? "—",
          bolumM2: {},
          eurTry: snap?.rate ?? null,
        });
        setTeklifV14(v14);
        logPfosQuoteGenerated(v14, "liste");
      } catch (e) {
        setError(e instanceof Error ? e.message : t("Beklenmeyen hata"));
      } finally {
        setLoadingKind(null);
      }
    },
    [t],
  );

  const onPick = useCallback(
    (files: FileList | null | undefined) => {
      const f = files?.[0];
      if (f) void priceFile(f);
    },
    [priceFile],
  );

  return {
    t,
    inputRef,
    drag,
    setDrag,
    file,
    loadingKind,
    error,
    sonuc,
    teklifV14,
    memberReady,
    memberLoggedIn,
    loginHref,
    registerHref,
    reset,
    onPick,
  };
}
