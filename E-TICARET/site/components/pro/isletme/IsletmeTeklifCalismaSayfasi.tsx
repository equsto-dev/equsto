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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { publicAssetUrl } from "@/lib/public-asset-url";
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

function CatalogSuggest({
  value,
  placeholder,
  onChange,
  onPick,
  valueKey,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onPick: (hit: TeklifCatalogHit) => void;
  valueKey: "sku" | "name";
}) {
  const [opts, setOpts] = useState<TeklifCatalogHit[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) {
      setOpts([]);
      return;
    }
    timer.current = setTimeout(() => {
      void fetch(
        `/api/search?suggest=1&limit=8&q=${encodeURIComponent(query)}`,
        { cache: "no-store" },
      )
        .then((r) => r.json() as Promise<{ hits?: TeklifCatalogHit[] }>)
        .then((body) => setOpts(Array.isArray(body.hits) ? body.hits : []))
        .catch(() => setOpts([]));
    }, 280);
  }, []);

  return (
    <AutoComplete
      value={value}
      open={open && opts.length > 0}
      style={{ width: "100%" }}
      placeholder={placeholder}
      options={opts.map((h) => ({
        value: valueKey === "sku" ? h.sku || h.name : h.name,
        hit: h,
        label: (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {h.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={publicAssetUrl(h.image)}
                alt=""
                width={32}
                height={32}
                style={{ objectFit: "contain", background: "#f5f5f5" }}
              />
            ) : null}
            <div style={{ minWidth: 0 }}>
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
          </div>
        ),
      }))}
      onSearch={(q) => {
        onChange(q);
        search(q);
        setOpen(true);
      }}
      onChange={(q) => {
        onChange(q);
        search(q);
      }}
      onSelect={(_v, option) => {
        const hit = (option as { hit?: TeklifCatalogHit }).hit;
        if (hit) onPick(hit);
        setOpen(false);
      }}
      onBlur={() => setOpen(false)}
      onFocus={() => {
        if (value.trim().length >= 2) {
          search(value);
          setOpen(true);
        }
      }}
    />
  );
}

export default function IsletmeTeklifCalismaSayfasi({ teklifId }: Props) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<"email" | "whatsapp" | "pdf" | null>(
    null,
  );
  const [model, setModel] = useState<TeklifModelV14 | null>(null);
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

  const patchModel = useCallback((fn: (m: TeklifModelV14) => TeklifModelV14) => {
    setModel((prev) => (prev ? recomputeTeklifV14Ozet(fn(prev)) : prev));
  }, []);

  const patchSatir = useCallback(
    (index: number, patch: Partial<TeklifV14Satir> | ((s: TeklifV14Satir) => TeklifV14Satir)) => {
      patchModel((m) => ({
        ...m,
        satirlar: m.satirlar.map((s, i) => {
          if (i !== index) return s;
          return typeof patch === "function" ? patch(s) : { ...s, ...patch };
        }),
      }));
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
    if (!model) return;
    setSaving(true);
    try {
      const withMusteri = {
        ...model,
        ust: { ...model.ust, musteri: musteriAd },
      };
      const res = await saveTeklifRevize(teklifId, {
        teklif_v14: withMusteri,
        musteri,
      });
      if (res.error) message.error(res.error);
      else {
        message.success("Revize kaydedildi");
        setModel(withMusteri);
      }
    } finally {
      setSaving(false);
    }
  }

  async function onPdf() {
    if (!model) return;
    setSending("pdf");
    try {
      await onSave();
      const hint = model.ust.sayi || refNo;
      const res = await downloadTeklifPdf(teklifId, hint);
      if (res.error) message.error(res.error);
      else message.success("PDF indirildi");
    } finally {
      setSending(null);
    }
  }

  async function onSend(kanal: "email" | "whatsapp") {
    if (!model) return;
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
        ...model,
        ust: { ...model.ust, musteri: musteriAd },
      };
      const res = await sendTeklifYeniden(teklifId, {
        kanal,
        teklif_v14: withMusteri,
        musteri,
      });
      if (res.error) message.error(res.error);
      else {
        message.success(kanal === "email" ? "PDF e-posta ile gönderildi" : "PDF WhatsApp ile gönderildi");
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

  function removeSatir(index: number) {
    patchModel((m) => ({
      ...m,
      satirlar: m.satirlar.filter((_, i) => i !== index),
    }));
  }

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
          {formatEurHucre(model?.ozet.genelToplam ?? null)}
        </span>
      </Space>

      <Table<GridRow>
        rowKey="key"
        loading={loading}
        pagination={false}
        size="small"
        bordered
        scroll={{ x: 1400 }}
        dataSource={gridRows}
        onRow={(row) =>
          row.kind === "section"
            ? { style: { background: "#f0f0f0", fontWeight: 700 } }
            : {}
        }
        columns={[
          {
            title: "Böl",
            width: 56,
            render: (_, row) =>
              row.kind === "section" ? (
                <span>{row.bolumBaslik}</span>
              ) : (
                <Input
                  value={row.satir?.bolumNo}
                  onChange={(e) =>
                    patchSatir(row.satirIndex!, { bolumNo: e.target.value })
                  }
                />
              ),
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 12 } : { colSpan: 1 },
          },
          {
            title: "Poz",
            width: 72,
            render: (_, row) =>
              row.kind === "product" ? (
                <Input
                  value={row.satir?.poz}
                  onChange={(e) =>
                    patchSatir(row.satirIndex!, { poz: e.target.value })
                  }
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Stok no",
            width: 160,
            render: (_, row) =>
              row.kind === "product" && row.satir ? (
                <CatalogSuggest
                  value={row.satir.stokNo}
                  placeholder="EQ.KCT08…"
                  valueKey="sku"
                  onChange={(v) => patchSatir(row.satirIndex!, { stokNo: v })}
                  onPick={(hit) =>
                    patchSatir(row.satirIndex!, (s) =>
                      applyCatalogHitToSatir(s, hit),
                    )
                  }
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Tanımı",
            width: 280,
            render: (_, row) =>
              row.kind === "product" && row.satir ? (
                <div>
                  <CatalogSuggest
                    value={row.satir.tanim}
                    placeholder="Ürün adı yazın"
                    valueKey="name"
                    onChange={(v) => patchSatir(row.satirIndex!, { tanim: v })}
                    onPick={(hit) =>
                      patchSatir(row.satirIndex!, (s) =>
                        applyCatalogHitToSatir(s, hit),
                      )
                    }
                  />
                  <Input.TextArea
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    value={row.satir.aciklama || ""}
                    placeholder="Açıklama"
                    onChange={(e) =>
                      patchSatir(row.satirIndex!, { aciklama: e.target.value })
                    }
                    style={{ marginTop: 4, fontSize: 11 }}
                  />
                </div>
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Ölçü",
            width: 110,
            render: (_, row) =>
              row.kind === "product" ? (
                <Input
                  value={row.satir?.olcu}
                  onChange={(e) =>
                    patchSatir(row.satirIndex!, { olcu: e.target.value })
                  }
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Marka",
            width: 100,
            render: (_, row) =>
              row.kind === "product" ? (
                <Input
                  value={row.satir?.marka}
                  onChange={(e) =>
                    patchSatir(row.satirIndex!, { marka: e.target.value })
                  }
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Elk",
            width: 72,
            render: (_, row) =>
              row.kind === "product" ? (
                <InputNumber
                  value={row.satir?.elkKw ?? undefined}
                  onChange={(v) =>
                    patchSatir(row.satirIndex!, {
                      elkKw: typeof v === "number" ? v : null,
                    })
                  }
                  style={{ width: "100%" }}
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Gaz",
            width: 72,
            render: (_, row) =>
              row.kind === "product" ? (
                <InputNumber
                  value={row.satir?.gazKw ?? undefined}
                  onChange={(v) =>
                    patchSatir(row.satirIndex!, {
                      gazKw: typeof v === "number" ? v : null,
                    })
                  }
                  style={{ width: "100%" }}
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Adet",
            width: 72,
            render: (_, row) =>
              row.kind === "product" ? (
                <InputNumber
                  min={1}
                  value={row.satir?.adet}
                  onChange={(v) =>
                    patchSatir(row.satirIndex!, {
                      adet: typeof v === "number" ? v : 1,
                    })
                  }
                  style={{ width: "100%" }}
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Satış",
            width: 90,
            render: (_, row) =>
              row.kind === "product" ? (
                <InputNumber
                  min={0}
                  value={row.satir?.birimSatis ?? undefined}
                  onChange={(v) =>
                    patchSatir(row.satirIndex!, {
                      birimSatis: typeof v === "number" ? v : null,
                    })
                  }
                  style={{ width: "100%" }}
                />
              ) : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "Toplam",
            width: 90,
            render: (_, row) =>
              row.kind === "product"
                ? formatEurHucre(row.satir?.toplamSatis ?? null)
                : null,
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
          {
            title: "",
            width: 108,
            render: (_, row) => {
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
            onCell: (row) =>
              row.kind === "section" ? { colSpan: 0 } : { colSpan: 1 },
          },
        ]}
      />

      <Button
        icon={<PlusOutlined />}
        onClick={addSatir}
        style={{ marginTop: 12 }}
        disabled={!model}
      >
        Satır ekle
      </Button>
    </PageContainer>
  );
}
