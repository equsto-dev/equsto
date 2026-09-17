"use client";

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  MailOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import {
  App,
  AutoComplete,
  Button,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
} from "antd";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import {
  applyCatalogHitToSatir,
  emptyTeklifSatir,
  recomputeTeklifV14Ozet,
  type TeklifCatalogHit,
} from "@/lib/pfos/teklif/catalog-hit-to-satir";
import { formatEurHucre } from "@/lib/pfos/teklif/format-v14";
import type {
  TeklifModelV14,
  TeklifV14Satir,
} from "@/lib/pfos/teklif/teklif-v14.types";
import {
  downloadTeklifPdf,
  fetchTeklifDetay,
  saveTeklifRevize,
  sendTeklifYeniden,
} from "@/lib/pro-admin-client";

type Props = { teklifId: string };

type GridRow = {
  key: string;
  kind: "section" | "product";
  satirIndex?: number;
  bolumBaslik?: string;
  satir?: TeklifV14Satir;
};

const editorFlushers = new Set<() => void>();

function flushEditors() {
  flushSync(() => {
    for (const flush of editorFlushers) flush();
  });
}

function useEditorFlusher(flush: () => void) {
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => {
    const fn = () => flushRef.current();
    editorFlushers.add(fn);
    return () => {
      editorFlushers.delete(fn);
    };
  }, []);
}

function nextPoz(satirlar: TeklifV14Satir[], bolumNo: string): string {
  const nums = satirlar
    .filter((s) => s.bolumNo === bolumNo)
    .map((s) => {
      const m = String(s.poz || "").match(/(\d+)\s*$/);
      return m ? Number(m[1]) : 0;
    });
  const n = Math.max(0, ...nums) + 1;
  const prefix = satirlar.find((s) => s.bolumNo === bolumNo)?.poz.replace(/\d+\s*$/, "") || "A";
  return `${prefix}${n}`;
}

function satirDurum(s: TeklifV14Satir): { color: string; label: string } {
  const fiyat = s.birimSatis != null && s.birimSatis > 0;
  if (fiyat && s.stokNo) return { color: "green", label: "Katalog" };
  if (fiyat) return { color: "gold", label: "Fiyat" };
  return { color: "red", label: "Fiyatsız" };
}

const DraftInput = memo(function DraftInput({
  value,
  onCommit,
  textarea,
}: {
  value: string;
  onCommit: (v: string) => void;
  textarea?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const draftRef = useRef(draft);
  const valueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  draftRef.current = draft;
  valueRef.current = value;
  onCommitRef.current = onCommit;
  useEditorFlusher(() => {
    if (draftRef.current !== valueRef.current) {
      onCommitRef.current(draftRef.current);
    }
  });
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  const common = {
    value: draft,
    onFocus: () => {
      focused.current = true;
    },
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(e.target.value);
    },
    onBlur: () => {
      focused.current = false;
      if (draft !== value) onCommit(draft);
    },
  };
  if (textarea) {
    return (
      <Input.TextArea
        {...common}
        autoSize={{ minRows: 1, maxRows: 3 }}
        placeholder="Açıklama"
        style={{ marginTop: 4, fontSize: 11 }}
      />
    );
  }
  return (
    <Input
      {...common}
      onPressEnter={() => {
        if (draft !== value) onCommit(draft);
      }}
    />
  );
});

const DraftNumber = memo(function DraftNumber({
  value,
  onCommit,
  min,
  max,
  style,
}: {
  value: number | null | undefined;
  onCommit: (v: number | null) => void;
  min?: number;
  max?: number;
  style?: CSSProperties;
}) {
  const [draft, setDraft] = useState<number | null>(value ?? null);
  const focused = useRef(false);
  const draftRef = useRef(draft);
  const valueRef = useRef(value ?? null);
  const onCommitRef = useRef(onCommit);
  draftRef.current = draft;
  valueRef.current = value ?? null;
  onCommitRef.current = onCommit;
  useEditorFlusher(() => {
    if (draftRef.current !== valueRef.current) {
      onCommitRef.current(draftRef.current);
    }
  });
  useEffect(() => {
    if (!focused.current) setDraft(value ?? null);
  }, [value]);
  return (
    <InputNumber
      min={min}
      max={max}
      value={draft ?? undefined}
      style={{ width: "100%", ...style }}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(v) => setDraft(typeof v === "number" ? v : null)}
      onBlur={() => {
        focused.current = false;
        if (draft !== (value ?? null)) onCommit(draft);
      }}
    />
  );
});

const CatalogSuggest = memo(function CatalogSuggest({
  value,
  placeholder,
  onCommit,
  onPick,
  valueKey,
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
  onPick: (hit: TeklifCatalogHit) => void;
  valueKey: "sku" | "name";
}) {
  const [draft, setDraft] = useState(value);
  const [opts, setOpts] = useState<TeklifCatalogHit[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const focused = useRef(false);
  const picked = useRef(false);
  const draftRef = useRef(draft);
  const valueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  draftRef.current = draft;
  valueRef.current = value;
  onCommitRef.current = onCommit;
  useEditorFlusher(() => {
    if (!picked.current && draftRef.current !== valueRef.current) {
      onCommitRef.current(draftRef.current);
    }
  });

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const search = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    abortRef.current?.abort();
    const query = q.trim();
    if (query.length < 2) {
      setOpts([]);
      return;
    }
    timer.current = setTimeout(() => {
      const ac = new AbortController();
      abortRef.current = ac;
      void fetch(
        `/api/search?suggest=1&limit=8&q=${encodeURIComponent(query)}`,
        { cache: "force-cache", signal: ac.signal },
      )
        .then((r) => r.json() as Promise<{ hits?: TeklifCatalogHit[] }>)
        .then((body) => {
          if (!ac.signal.aborted) {
            setOpts(Array.isArray(body.hits) ? body.hits : []);
          }
        })
        .catch(() => {
          if (!ac.signal.aborted) setOpts([]);
        });
    }, 400);
  }, []);

  return (
    <AutoComplete
      value={draft}
      open={open && opts.length > 0}
      style={{ width: "100%" }}
      placeholder={placeholder}
      filterOption={false}
      defaultActiveFirstOption={false}
      options={opts.map((h) => ({
        value: valueKey === "sku" ? h.sku || h.name : h.name,
        hit: h,
        label: (
          <div style={{ minWidth: 0, lineHeight: 1.25 }}>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{h.sku || "—"}</div>
            <div
              style={{
                fontSize: 12,
                color: "#555",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {h.name}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {h.brand}
              {h.satis_eur_indirimli
                ? ` · ${Math.round(h.satis_eur_indirimli)} €`
                : ""}
            </div>
          </div>
        ),
      }))}
      onChange={(q) => {
        picked.current = false;
        setDraft(q);
      }}
      onSearch={(q) => {
        picked.current = false;
        setDraft(q);
        search(q);
        setOpen(true);
      }}
      onSelect={(_v, option) => {
        picked.current = true;
        const hit = (option as { hit?: TeklifCatalogHit }).hit;
        if (hit) {
          const next = valueKey === "sku" ? hit.sku || hit.name : hit.name;
          setDraft(next);
          onPick(hit);
        }
        setOpen(false);
      }}
      onBlur={() => {
        focused.current = false;
        setOpen(false);
        if (!picked.current && draft !== value) onCommit(draft);
      }}
      onFocus={() => {
        focused.current = true;
        picked.current = false;
        if (draft.trim().length >= 2) {
          search(draft);
          setOpen(true);
        }
      }}
    />
  );
});

const sectionSpan = (row: GridRow) =>
  row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 };

const TeklifGrid = memo(function TeklifGrid({
  loading,
  gridRows,
  patchSatir,
  removeSatir,
}: {
  loading: boolean;
  gridRows: GridRow[];
  patchSatir: (
    index: number,
    patch: Partial<TeklifV14Satir> | ((s: TeklifV14Satir) => TeklifV14Satir),
    totals?: boolean,
  ) => void;
  removeSatir: (index: number) => void;
}) {
  const columns = useMemo(
    () => [
      {
        title: "Böl",
        width: 56,
        render: (_: unknown, row: GridRow) =>
          row.kind === "section" ? (
            <span>{row.bolumBaslik}</span>
          ) : (
            <DraftInput
              value={row.satir?.bolumNo || ""}
              onCommit={(v) => patchSatir(row.satirIndex!, { bolumNo: v }, false)}
            />
          ),
        onCell: (row: GridRow) =>
          row.kind === "section" ? { colSpan: 12 } : { colSpan: 1 },
      },
      {
        title: "Poz",
        width: 72,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" ? (
            <DraftInput
              value={row.satir?.poz || ""}
              onCommit={(v) => patchSatir(row.satirIndex!, { poz: v }, false)}
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Stok no",
        width: 160,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" && row.satir ? (
            <CatalogSuggest
              value={row.satir.stokNo}
              placeholder="EQ.KCT08…"
              valueKey="sku"
              onCommit={(v) => patchSatir(row.satirIndex!, { stokNo: v }, false)}
              onPick={(hit) =>
                patchSatir(row.satirIndex!, (s) => applyCatalogHitToSatir(s, hit))
              }
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Tanımı",
        width: 280,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" && row.satir ? (
            <div>
              <CatalogSuggest
                value={row.satir.tanim}
                placeholder="Ürün adı yazın"
                valueKey="name"
                onCommit={(v) => patchSatir(row.satirIndex!, { tanim: v }, false)}
                onPick={(hit) =>
                  patchSatir(row.satirIndex!, (s) =>
                    applyCatalogHitToSatir(s, hit),
                  )
                }
              />
              <DraftInput
                textarea
                value={row.satir.aciklama || ""}
                onCommit={(v) =>
                  patchSatir(row.satirIndex!, { aciklama: v }, false)
                }
              />
            </div>
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Ölçü",
        width: 110,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" ? (
            <DraftInput
              value={row.satir?.olcu || ""}
              onCommit={(v) => patchSatir(row.satirIndex!, { olcu: v }, false)}
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Marka",
        width: 100,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" ? (
            <DraftInput
              value={row.satir?.marka || ""}
              onCommit={(v) => patchSatir(row.satirIndex!, { marka: v }, false)}
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Elk",
        width: 72,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" ? (
            <DraftNumber
              value={row.satir?.elkKw}
              onCommit={(v) => patchSatir(row.satirIndex!, { elkKw: v })}
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Gaz",
        width: 72,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" ? (
            <DraftNumber
              value={row.satir?.gazKw}
              onCommit={(v) => patchSatir(row.satirIndex!, { gazKw: v })}
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Adet",
        width: 72,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" ? (
            <DraftNumber
              min={1}
              value={row.satir?.adet}
              onCommit={(v) =>
                patchSatir(row.satirIndex!, { adet: v != null && v > 0 ? v : 1 })
              }
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Satış",
        width: 90,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product" ? (
            <DraftNumber
              min={0}
              value={row.satir?.birimSatis}
              onCommit={(v) => patchSatir(row.satirIndex!, { birimSatis: v })}
            />
          ) : null,
        onCell: sectionSpan,
      },
      {
        title: "Toplam",
        width: 90,
        render: (_: unknown, row: GridRow) =>
          row.kind === "product"
            ? formatEurHucre(row.satir?.toplamSatis ?? null)
            : null,
        onCell: sectionSpan,
      },
      {
        title: "",
        width: 108,
        render: (_: unknown, row: GridRow) => {
          if (row.kind !== "product" || !row.satir) return null;
          const d = satirDurum(row.satir);
          return (
            <Space size={4}>
              <Tag color={d.color} style={{ margin: 0 }}>
                {d.label}
              </Tag>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeSatir(row.satirIndex!)}
              />
            </Space>
          );
        },
        onCell: sectionSpan,
      },
    ],
    [patchSatir, removeSatir],
  );

  return (
    <Table<GridRow>
      rowKey="key"
      loading={loading}
      pagination={false}
      size="small"
      bordered
      scroll={{ x: 1400 }}
      dataSource={gridRows}
      columns={columns}
      onRow={(row) =>
        row.kind === "section"
          ? { style: { background: "#f0f0f0", fontWeight: 700 } }
          : {}
      }
    />
  );
});

export default function IsletmeTeklifCalismaSayfasi({ teklifId }: Props) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<"email" | "whatsapp" | "pdf" | null>(
    null,
  );
  const [model, setModel] = useState<TeklifModelV14 | null>(null);
  const modelRef = useRef<TeklifModelV14 | null>(null);
  modelRef.current = model;
  const [musteriAd, setMusteriAd] = useState("");
  const [musteriTel, setMusteriTel] = useState("");
  const [musteriMail, setMusteriMail] = useState("");
  const [refNo, setRefNo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeklifDetay(teklifId);
      if (res.error || !res.row) {
        message.error(res.error || "Teklif bulunamadı");
        return;
      }
      setRefNo(res.row.ref_no);
      setMusteriAd(res.row.musteri_ad || "");
      setMusteriTel(res.row.musteri_tel || "");
      setMusteriMail(res.row.musteri_mail || "");
      if (res.row.teklif_v14) {
        const next = { ...res.row.teklif_v14 };
        if (!next.ust.musteri) next.ust = { ...next.ust, musteri: res.row.musteri_ad };
        setModel(recomputeTeklifV14Ozet(next));
      } else {
        setModel({
          version: "v14",
          formNo: "EQS-TKL-001",
          ust: {
            projeAdi: res.row.konsept || res.row.ref_no,
            musteri: res.row.musteri_ad || "",
            sayi: res.row.teklif_sayi || res.row.ref_no,
            tarih: (res.row.created_at || "").slice(0, 10),
            eurTry: null,
          },
          satirlar: [],
          ozet: {
            toplamElektrikKw: 0,
            toplamGazKw: 0,
            araToplam: null,
            iskontoYuzde: 0,
            iskontoTutar: 0,
            genelToplam: null,
            doviz: "EUR",
          },
          sartlar: [],
          meta: {
            konsept: "",
            konseptLabel: res.row.konsept || "",
            sehir: "",
            m2Toplam: 0,
            bolumM2: {},
            teslimatAdresi: "",
          },
        });
        message.warning("Kalem kaydı yok — satır ekleyip katalogdan doldurun.");
      }
    } finally {
      setLoading(false);
    }
  }, [message, teklifId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchModel = useCallback(
    (fn: (m: TeklifModelV14) => TeklifModelV14, totals = true) => {
      setModel((prev) => {
        if (!prev) return prev;
        const next = totals ? recomputeTeklifV14Ozet(fn(prev)) : fn(prev);
        modelRef.current = next;
        return next;
      });
    },
    [],
  );

  const patchSatir = useCallback(
    (
      index: number,
      patch: Partial<TeklifV14Satir> | ((s: TeklifV14Satir) => TeklifV14Satir),
      totals = true,
    ) => {
      patchModel((m) => ({
        ...m,
        satirlar: m.satirlar.map((s, i) => {
          if (i !== index) return s;
          return typeof patch === "function" ? patch(s) : { ...s, ...patch };
        }),
      }), totals);
    },
    [patchModel],
  );

  const gridRows: GridRow[] = useMemo(() => {
    if (!model) return [];
    const out: GridRow[] = [];
    let lastBolum = "";
    model.satirlar.forEach((s, i) => {
      const bolumKey = `${s.bolumNo}|${s.bolumBaslik}`;
      if (bolumKey !== lastBolum) {
        lastBolum = bolumKey;
        out.push({
          key: `sec-${bolumKey}-${i}`,
          kind: "section",
          bolumBaslik: s.bolumBaslik,
        });
      }
      out.push({
        key: `p-${i}-${s.poz}`,
        kind: "product",
        satirIndex: i,
        satir: s,
      });
    });
    return out;
  }, [model]);

  const musteri = useMemo(
    () => ({ ad: musteriAd, telefon: musteriTel, eposta: musteriMail }),
    [musteriAd, musteriTel, musteriMail],
  );

  async function onSave() {
    flushEditors();
    const current = modelRef.current;
    if (!current) return;
    setSaving(true);
    try {
      const withMusteri = {
        ...current,
        ust: { ...current.ust, musteri: musteriAd },
      };
      const res = await saveTeklifRevize(teklifId, {
        teklif_v14: withMusteri,
        musteri,
      });
      if (res.error) message.error(res.error);
      else {
        message.success("Revize kaydedildi");
        modelRef.current = withMusteri;
        setModel(withMusteri);
      }
    } finally {
      setSaving(false);
    }
  }

  async function onPdf() {
    const current = modelRef.current;
    if (!current) return;
    setSending("pdf");
    try {
      await onSave();
      const hint = modelRef.current?.ust.sayi || current.ust.sayi || refNo;
      const res = await downloadTeklifPdf(teklifId, hint);
      if (res.error) message.error(res.error);
      else message.success("PDF indirildi");
    } finally {
      setSending(null);
    }
  }

  async function onSend(kanal: "email" | "whatsapp") {
    flushEditors();
    const current = modelRef.current;
    if (!current) return;
    if (kanal === "email" && !musteriMail.trim()) {
      message.error("E-posta gerekli");
      return;
    }
    if (kanal === "whatsapp" && !musteriTel.trim()) {
      message.error("Telefon gerekli");
      return;
    }
    setSending(kanal);
    try {
      const withMusteri = {
        ...current,
        ust: { ...current.ust, musteri: musteriAd },
      };
      const res = await sendTeklifYeniden(teklifId, {
        kanal,
        teklif_v14: withMusteri,
        musteri,
      });
      if (res.error) message.error(res.error);
      else {
        message.success(kanal === "email" ? "PDF e-posta ile gönderildi" : "PDF WhatsApp ile gönderildi");
        modelRef.current = withMusteri;
        setModel(withMusteri);
      }
    } finally {
      setSending(null);
    }
  }

  function addSatir() {
    patchModel((m) => {
      const last = m.satirlar[m.satirlar.length - 1];
      const bolumNo = last?.bolumNo || "01";
      const bolumBaslik = last?.bolumBaslik || "01. LİSTE";
      return {
        ...m,
        satirlar: [
          ...m.satirlar,
          emptyTeklifSatir({
            bolumNo,
            bolumBaslik,
            poz: nextPoz(m.satirlar, bolumNo),
          }),
        ],
      };
    });
  }

  const removeSatir = useCallback(
    (index: number) => {
      patchModel((m) => ({
        ...m,
        satirlar: m.satirlar.filter((_, i) => i !== index),
      }));
    },
    [patchModel],
  );

  const patchIskontoYuzde = useCallback(
    (v: number | null) => {
      patchModel((m) => ({
        ...m,
        ozet: {
          ...m.ozet,
          iskontoYuzde: v != null && Number.isFinite(v) ? v : 0,
        },
      }));
    },
    [patchModel],
  );

  const sayi = model?.ust.sayi || refNo || teklifId;

  return (
    <PageContainer
      title={sayi}
      subTitle="Teklif çalışma sayfası — kod veya ad yazınca siteden dolar"
      extra={
        <Space wrap>
          <Link href="/yonetim/isletme?tab=teklifler">
            <Button icon={<ArrowLeftOutlined />}>Teklifler</Button>
          </Link>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => void onSave()}
            disabled={!model}
          >
            Kaydet
          </Button>
          <Button loading={sending === "pdf"} onClick={() => void onPdf()} disabled={!model}>
            PDF
          </Button>
          <Button
            icon={<MailOutlined />}
            loading={sending === "email"}
            onClick={() => void onSend("email")}
            disabled={!model}
          >
            E-posta
          </Button>
          <Button
            loading={sending === "whatsapp"}
            onClick={() => void onSend("whatsapp")}
            disabled={!model}
          >
            WhatsApp
          </Button>
        </Space>
      }
    >
      <Space wrap style={{ marginBottom: 12 }} size="middle">
        <Input
          addonBefore="Müşteri"
          value={musteriAd}
          onChange={(e) => setMusteriAd(e.target.value)}
          style={{ width: 220 }}
        />
        <Input
          addonBefore="E-posta"
          value={musteriMail}
          onChange={(e) => setMusteriMail(e.target.value)}
          style={{ width: 260 }}
        />
        <Input
          addonBefore="Telefon"
          value={musteriTel}
          onChange={(e) => setMusteriTel(e.target.value)}
          style={{ width: 200 }}
        />
        <span style={{ color: "#888" }}>
          Kur: {model?.ust.eurTry != null ? model.ust.eurTry.toFixed(4) : "—"} · Genel{" "}
          {formatEurHucre(model?.ozet.genelToplam ?? null, 2)}
        </span>
      </Space>

      <TeklifGrid
        loading={loading}
        gridRows={gridRows}
        patchSatir={patchSatir}
        removeSatir={removeSatir}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        <Button icon={<PlusOutlined />} onClick={addSatir} disabled={!model}>
          Satır ekle
        </Button>
        <table style={{ minWidth: 320, fontSize: 13, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 12px 6px 0", color: "#555" }}>Toplam</td>
              <td style={{ padding: "6px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {formatEurHucre(model?.ozet.araToplam ?? model?.ozet.genelToplam ?? null, 2)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 12px 6px 0", color: "#555" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>İskonto</span>
                  <div style={{ width: 72 }}>
                    <DraftNumber
                      min={0}
                      max={100}
                      value={model?.ozet.iskontoYuzde ?? 0}
                      onCommit={patchIskontoYuzde}
                    />
                  </div>
                  <span>%</span>
                </div>
              </td>
              <td style={{ padding: "6px 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {(model?.ozet.iskontoTutar ?? 0) > 0
                  ? `− ${formatEurHucre(model?.ozet.iskontoTutar ?? 0, 2)}`
                  : formatEurHucre(0, 2)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px 6px 0", fontWeight: 700 }}>Genel toplam</td>
              <td
                style={{
                  padding: "8px 0 6px",
                  textAlign: "right",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatEurHucre(model?.ozet.genelToplam ?? null, 2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
