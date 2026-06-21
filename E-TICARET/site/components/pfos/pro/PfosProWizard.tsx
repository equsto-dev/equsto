"use client";

import {
  ArrowLeftOutlined,
  CalculatorOutlined,
  ReloadOutlined,
  CoffeeOutlined,
  ShopOutlined,
  RestOutlined,
  CrownOutlined,
  FireOutlined,
  CompassOutlined,
  ThunderboltOutlined,
  HomeOutlined,
  PartitionOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

const SEGMENT_ICONS: Record<string, React.ReactNode> = {
  CoffeeOutlined: <CoffeeOutlined />,
  ShopOutlined: <ShopOutlined />,
  RestOutlined: <RestOutlined />,
  CrownOutlined: <CrownOutlined />,
  FireOutlined: <FireOutlined />,
  CompassOutlined: <CompassOutlined />,
  ThunderboltOutlined: <ThunderboltOutlined />,
  HomeOutlined: <HomeOutlined />,
  PartitionOutlined: <PartitionOutlined />,
};
import {
  ProCard,
  ProForm,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  StatisticCard,
} from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
  Empty,
  Form,
  InputNumber,
  Row,
  Space,
  Spin,
  Steps,
  Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import type { Konsept, PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import {
  TEKLIF_DEFAULT_FIYAT_STRATEJISI,
  teklifMarkaPaneliOzeti,
} from "@/lib/pfos/teklif/teklif-policy";
import { pfosResponseToTeklifV14 } from "@/lib/pfos/teklif/map-pfos-response";
import { formatTarihTr } from "@/lib/pfos/teklif/format-v14";
import { parseConceptsResponse } from "@/lib/pfos/wizard/parse-concepts";
import {
  adresOzeti,
  parseM2,
  PFOS_WIZARD_ADIMLAR,
  type KonseptMeta,
  type PfosWizardState,
} from "@/lib/pfos/wizard/types";
import { dagitM2Toplam, mutfakM2FromToplam, zonesForKonsept } from "@/lib/pfos/wizard/profiles";
import { zoneLabel } from "@/lib/pfos/wizard/zone-labels";
import { PROFIL_BY_SLUG } from "@/lib/pfos/wizard/profiles";
import {
  PFOS_QUICK_MODE,
  pfosQuickInitialState,
  pfosWizardInitialState,
} from "@/lib/pfos/wizard/quick-mode";
import { PfosKalemProTable, PfosV14ProTable } from "./PfosTeklifProTable";
import TeklifV14Proforma from "@/components/pfos/TeklifV14Proforma";
import {
  fetchTcmbKurForTeklif,
  formatTeklifKurLine,
  type TeklifKurSnapshot,
} from "@/lib/pfos/teklif/fetch-kur.client";
import type { PfosProjeDetail } from "@/lib/pfos/projects/load-project-detail";
import { TEKLIF_V14_EUR_TRY_URL } from "@/lib/pfos/teklif/constants";

const ILLER = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Mersin",
  "Kayseri",
  "Diyarbakır",
  "Samsun",
  "Trabzon",
  "Eskişehir",
  "Muğla",
  "Kocaeli",
];

const INITIAL = pfosWizardInitialState();

function sumBolum(bolum: Record<string, number | string>): number {
  return Object.values(bolum).reduce<number>((s, v) => s + parseM2(v), 0);
}

export default function PfosProWizard() {
  const { message } = App.useApp();
  const [state, setState] = useState<PfosWizardState>(INITIAL);
  const [konseptler, setKonseptler] = useState<KonseptMeta[]>([]);
  const [konseptYukleniyor, setKonseptYukleniyor] = useState(true);
  const [sonuc, setSonuc] = useState<PFOSResponse | null>(null);
  const [teklifV14, setTeklifV14] = useState<TeklifModelV14 | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [kur, setKur] = useState<TeklifKurSnapshot | null>(null);
  const [kurYukleniyor, setKurYukleniyor] = useState(true);
  const [referansProjeler, setReferansProjeler] = useState<
    { id: string; baslik: string; zoneCount: number; dwgUrl?: string | null }[]
  >([]);
  const [referansYukleniyor, setReferansYukleniyor] = useState(false);
  const [taxonomy, setTaxonomy] = useState<{ segments: any[] } | null>(null);
  const [seciliSegment, setSeciliSegment] = useState<string | null>(null);

  const set = useCallback(
    (patch: Partial<PfosWizardState>) =>
      setState((s) => ({ ...s, ...patch })),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/pfos/concepts", { cache: "no-store" });
        const data = await res.json();
        let list = parseConceptsResponse(data);
        if (!list.length) {
          const alt = await fetch("/api/pfos?action=concepts", {
            cache: "no-store",
          });
          list = parseConceptsResponse(await alt.json());
        }
        if (!cancelled) setKonseptler(list);
      } catch {
        if (!cancelled) setHata("Konsept listesi yüklenemedi.");
      } finally {
        if (!cancelled) setKonseptYukleniyor(false);
      }
    })();

    (async () => {
      try {
        const res = await fetch("/api/pfos/taxonomy", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setTaxonomy(data);
      } catch (e) {
        console.error("Taxonomy load failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const kurYenile = useCallback(async () => {
    setKurYukleniyor(true);
    try {
      const snap = await fetchTcmbKurForTeklif();
      setKur(snap);
      return snap;
    } finally {
      setKurYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void kurYenile();
  }, [kurYenile]);

  function teklifV14WithKur(data: PFOSResponse, eurTry: number | null) {
    const projeAdi =
      state.projeAdi.trim() ||
      `${data.konseptLabel}${state.adres.il ? ` — ${state.adres.il}` : ""}`;
    return pfosResponseToTeklifV14(data, {
      projeAdi,
      musteri: state.musteri.trim(),
      teslimatAdresi: adresOzeti(state.adres),
      bolumM2: data.bolumM2 ?? bolumM2Sayilar(),
      eurTry,
    });
  }

  async function kurGuncelleVeTeklifYenile() {
    if (!sonuc) return;
    const snap = await kurYenile();
    if (!snap) {
      message.warning("TCMB kuru alınamadı.");
      return;
    }
    setTeklifV14(teklifV14WithKur(sonuc, snap.rate));
    message.success("Kur güncellendi — EUR satış fiyatları yeniden hesaplandı.");
  }

  const seciliKonsept = konseptler.find((k) => k.konsept === state.konsept);
  const m2Min = seciliKonsept?.m2Min ?? 30;
  const m2Max = seciliKonsept?.m2Max ?? 2000;
  const profil = state.konsept ? PROFIL_BY_SLUG[state.konsept] : null;
  const profileZones = zonesForKonsept(state.konsept);
  const activeZones =
    state.referansProjeId && state.referansZoneSecimi.length
      ? state.referansZoneSecimi
      : profileZones;
  const zones = activeZones;
  const toplamM2 = parseM2(state.m2Toplam);
  const mutfakM2 = mutfakM2FromToplam(toplamM2);
  const bolumToplam = sumBolum(state.bolumM2);
  const m2Fark = mutfakM2 > 0 ? mutfakM2 - bolumToplam : 0;
  const m2Ok =
    toplamM2 >= m2Min &&
    toplamM2 <= m2Max &&
    (bolumToplam === 0 || Math.abs(m2Fark) < 1);

  function bolumFromReferansSecimi(
    secili: string[],
    kaynak: Record<string, number>,
  ): Record<string, number | string> {
    const out: Record<string, number | string> = {};
    for (const z of secili) {
      const v = kaynak[z];
      if (v != null && v > 0) out[z] = v;
    }
    return out;
  }

  function handleKonsept(k: Konsept) {
    const t = parseM2(state.m2Toplam);
    const z = zonesForKonsept(k);
    set({
      konsept: k,
      referansProjeId: null,
      referansZoneSecimi: [],
      referansBolumM2: {},
      bolumM2: t > 0 && z.length ? dagitM2Toplam(z, t, k) : {},
    });
  }

  const applyReferansProje = useCallback(
    async (projeId: string | null) => {
      if (!projeId) {
        set({
          referansProjeId: null,
          referansZoneSecimi: [],
          referansBolumM2: {},
        });
        return;
      }
      setReferansYukleniyor(true);
      try {
        const res = await fetch(`/api/pfos/projects/${encodeURIComponent(projeId)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Proje detayı alınamadı");
        const j = (await res.json()) as { project?: PfosProjeDetail };
        const p = j.project;
        if (!p) throw new Error("Proje bulunamadı");
        const secili = p.pfosZones ?? [];
        set({
          referansProjeId: p.id,
          referansBolumM2: p.bolumM2,
          referansZoneSecimi: secili,
          m2Toplam: p.m2Toplam,
          bolumM2: bolumFromReferansSecimi(secili, p.bolumM2),
          projeAdi: p.baslik,
        });
        message.success(`${p.baslik} — ${secili.length} bölüm yüklendi`);
      } catch (e) {
        message.error(e instanceof Error ? e.message : "Referans proje yüklenemedi");
      } finally {
        setReferansYukleniyor(false);
      }
    },
    [message, set],
  );

  function toggleReferansZone(zoneKey: string, checked: boolean) {
    const next = checked
      ? [...state.referansZoneSecimi, zoneKey]
      : state.referansZoneSecimi.filter((z) => z !== zoneKey);
    set({
      referansZoneSecimi: next,
      bolumM2: bolumFromReferansSecimi(next, state.referansBolumM2),
    });
  }

  useEffect(() => {
    if (!state.konsept || !seciliKonsept) {
      setReferansProjeler([]);
      return;
    }
    let cancelled = false;
    setReferansYukleniyor(true);
    fetch("/api/pfos/projects", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const label = seciliKonsept.label.toLowerCase();
        const slug = state.konsept!.toLowerCase();
        const list = (j.projects ?? [])
          .filter(
            (p: {
              detailAvailable?: boolean;
              konsept?: string;
              dukkan?: string;
              id?: string;
            }) =>
              p.detailAvailable &&
              ((p.konsept ?? "").toLowerCase().includes(slug) ||
                (p.dukkan ?? "").toLowerCase().includes(label) ||
                label.includes((p.konsept ?? "").toLowerCase())),
          )
          .map(
            (p: {
              id: string;
              baslik: string;
              zoneCount: number;
              dwgUrl?: string | null;
            }) => ({
              id: p.id,
              baslik: p.baslik,
              zoneCount: p.zoneCount,
              dwgUrl: p.dwgUrl,
            }),
          );
        setReferansProjeler(list);
      })
      .catch(() => {
        if (!cancelled) setReferansProjeler([]);
      })
      .finally(() => {
        if (!cancelled) setReferansYukleniyor(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state.konsept, seciliKonsept]);

  function handleM2Toplam(v: number | null) {
    const val = v ?? "";
    setState((s) => {
      const t = parseM2(val);
      const z = zonesForKonsept(s.konsept);
      if (t > 0 && z.length && !s.referansProjeId) {
        return {
          ...s,
          m2Toplam: val,
          bolumM2: { ...s.bolumM2, ...dagitM2Toplam(z, t, s.konsept) },
        };
      }
      return { ...s, m2Toplam: val };
    });
  }

  const m2ToplamExtra =
    seciliKonsept ? (
      <>
        Geçerli aralık: {m2Min}–{m2Max} m²
        {toplamM2 > 0 && (
          <>
            {" · "}
            Mutfak alanı (toplamın 1/3&apos;ü): {mutfakM2} m²
          </>
        )}
      </>
    ) : toplamM2 > 0 ? (
      <>Mutfak alanı (toplamın 1/3&apos;ü): {mutfakM2} m²</>
    ) : undefined;

  function bolumM2Sayilar(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [z, v] of Object.entries(state.bolumM2)) {
      const n = parseM2(v);
      if (n > 0) out[z] = n;
    }
    return out;
  }

  async function teklifOlustur() {
    if (!state.konsept) return;
    const m2 = parseM2(state.m2Toplam);
    if (m2 < m2Min || m2 > m2Max) return;

    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch("/api/pfos/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konsept: state.konsept,
          m2,
          sehir: state.adres.il,
          lokasyon: state.lokasyon,
          fiyatStratejisi: TEKLIF_DEFAULT_FIYAT_STRATEJISI,
          bolumM2: state.detaySeviyesi === "hizli" ? {} : bolumM2Sayilar(),
          teslimatAdresi: adresOzeti(state.adres),
          detaySeviyesi: state.detaySeviyesi,
          teshirVitrinleriDahil: state.detaySeviyesi === "hizli" ? true : state.teshirVitrinleriDahil,
          bulasikKapasitesiYuksek: state.detaySeviyesi === "hizli" ? false : state.bulasikKapasitesiYuksek,
          referansId: state.detaySeviyesi === "detayli" ? (state.referansProjeId ?? undefined) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Sunucu hatası",
        );
      }
      const data: PFOSResponse = await res.json();
      const snap = kur ?? (await fetchTcmbKurForTeklif());
      if (snap && !kur) setKur(snap);
      const eurTry = snap?.rate ?? null;
      if (!eurTry) {
        message.warning(
          "TCMB kuru alınamadı — EUR satış sütunları boş veya TL olarak gösterilebilir.",
        );
      }
      setSonuc(data);
      setTeklifV14(teklifV14WithKur(data, eurTry));
      set({ adim: 3 });
      message.success("Teklif oluşturuldu");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Teklif oluşturulamadı.";
      setHata(msg);
      message.error(msg);
    } finally {
      setYukleniyor(false);
    }
  }

  function yeniTeklif() {
    setSonuc(null);
    setTeklifV14(null);
    setState(PFOS_QUICK_MODE ? pfosQuickInitialState() : INITIAL);
    setHata(null);
  }

  if (state.adim === 3 && sonuc && teklifV14) {
    const skorPct = Math.round(sonuc.guvenSkoru * 100);
    const eksikZorunlu = sonuc.kalemler.filter((k) => k.tip === "zorunlu" && !k.urun);
    return (
      <div>
        <Space style={{ marginBottom: 16 }} wrap>
          <Button icon={<ReloadOutlined />} onClick={yeniTeklif}>
            Yeni teklif
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={kurYukleniyor}
            onClick={() => void kurGuncelleVeTeklifYenile()}
          >
            Kur güncelle
          </Button>
          <Button href="/pfos.html" target="_blank">
            Canlı vitrin (legacy)
          </Button>
        </Space>

        {kur && (
          <Alert
            type={kur.fallback ? "warning" : "success"}
            showIcon
            style={{ marginBottom: 16 }}
            message={formatTeklifKurLine(kur)}
            description={
              kur.fallback
                ? "TCMB’ye ulaşılamadı — yedek kur kullanıldı. Excel ve EUR fiyatları buna göre hesaplandı."
                : "Satış (EUR) sütunları bu kur ile hesaplandı."
            }
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <StatisticCard
              statistic={{
                title: "Güven skoru",
                value: skorPct,
                suffix: "%",
              }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatisticCard
              statistic={{
                title: "Zorunlu eşleşme",
                value: `${sonuc.ozet.eslesmisZorunluSayisi} / ${sonuc.ozet.zorunluKalemSayisi}`,
              }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatisticCard
              statistic={{
                title: "Tahmini toplam",
                value:
                  sonuc.ozet.toplamFiyat != null
                    ? sonuc.ozet.toplamFiyat.toLocaleString("tr-TR")
                    : "—",
                suffix: sonuc.ozet.toplamFiyat != null ? "TRY" : undefined,
              }}
            />
          </Col>
        </Row>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            eksikZorunlu.length > 0
              ? `${eksikZorunlu.length} zorunlu kalemde fiyat yok`
              : "Tüm zorunlu kalemler fiyatlandı"
          }
          description={`İlk yıl marka paneli: ${teklifMarkaPaneliOzeti()}`}
        />

        {sonuc.uyarilar.map((u, i) => (
          <Alert
            key={i}
            type={i === sonuc.uyarilar.length - 1 ? "info" : "warning"}
            message={u}
            showIcon
            style={{ marginBottom: 8 }}
          />
        ))}

        <ProCard
          title={`Proforma · ${teklifV14.formNo}`}
          subTitle={`${teklifV14.ust.sayi} · ${formatTarihTr(teklifV14.ust.tarih)}`}
          style={{ marginTop: 16 }}
        >
          <TeklifV14Proforma model={teklifV14} />
        </ProCard>

        <ProCard title="Tablo görünümü" style={{ marginTop: 16 }} collapsible defaultCollapsed>
          <PfosV14ProTable model={teklifV14} />
        </ProCard>

        <ProCard title="Kalem özeti" style={{ marginTop: 16 }} collapsible>
          <PfosKalemProTable sonuc={sonuc} />
        </ProCard>
      </div>
    );
  }

  return (
    <Spin spinning={yukleniyor} tip="Teklif hesaplanıyor…">
      <Alert
        type={kur?.fallback ? "warning" : kur ? "info" : "warning"}
        showIcon
        style={{ marginBottom: 16 }}
        message={
          kur
            ? formatTeklifKurLine(kur)
            : kurYukleniyor
              ? "TCMB efektif satış kuru yükleniyor…"
              : "TCMB kuru alınamadı"
        }
        description={
          kur ? (
            <Space wrap>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Kaynak: {TEKLIF_V14_EUR_TRY_URL}
                {kur.fallback ? " (yedek)" : ""}
              </Typography.Text>
              <Button
                size="small"
                type="link"
                icon={<ReloadOutlined />}
                loading={kurYukleniyor}
                onClick={() => void kurYenile()}
              >
                Yenile
              </Button>
            </Space>
          ) : (
            "EUR satış fiyatları için kur gerekli. Yenile’yi deneyin."
          )
        }
      />

      <Steps
        current={PFOS_QUICK_MODE ? 0 : state.adim}
        style={{ marginBottom: 24, maxWidth: 720 }}
        items={
          PFOS_QUICK_MODE
            ? [{ title: "Alan & teklif" }]
            : PFOS_WIZARD_ADIMLAR.slice(0, 3).map((s) => ({ title: s.label }))
        }
      />

      {PFOS_QUICK_MODE && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Hızlı mod (geçici)"
          description="Adres ve konsept adımları atlandı — varsayılan İstanbul · Coffee Shop · 120 m². Konsept ve m² aşağıdan değiştirilebilir."
        />
      )}

      {hata && (
        <Alert
          type="error"
          message={hata}
          showIcon
          closable
          onClose={() => setHata(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {!PFOS_QUICK_MODE && state.adim === 0 && (
        <ProCard title="Teslimat adresi">
          <ProForm
            submitter={false}
            layout="vertical"
            initialValues={{
              il: state.adres.il,
              ilce: state.adres.ilce,
              mahalle: state.adres.mahalle,
              cadde: state.adres.cadde,
              lokasyon: state.lokasyon,
            }}
            onValuesChange={(_, all) => {
              set({
                adres: {
                  il: String(all.il ?? ""),
                  ilce: String(all.ilce ?? ""),
                  mahalle: String(all.mahalle ?? ""),
                  cadde: String(all.cadde ?? ""),
                },
                lokasyon: all.lokasyon as PfosWizardState["lokasyon"],
              });
            }}
          >
            <ProFormSelect
              name="il"
              label="İl"
              showSearch
              options={ILLER.map((il) => ({ label: il, value: il }))}
              rules={[{ required: true, message: "İl seçin" }]}
            />
            <ProFormText name="ilce" label="İlçe" placeholder="İlçe" />
            <ProFormText name="mahalle" label="Mahalle" placeholder="Mahalle" />
            <ProFormText
              name="cadde"
              label="Cadde / sokak"
              placeholder="Cadde adı"
            />
            <ProFormRadio.Group
              name="lokasyon"
              label="Lokasyon tipi"
              options={[
                { label: "Cadde / sokak", value: "cadde" },
                { label: "AVM", value: "avm" },
              ]}
            />
          </ProForm>
          <Button
            type="primary"
            disabled={!state.adres.il?.trim()}
            onClick={() => set({ adim: 1 })}
          >
            Devam — Konsept
          </Button>
        </ProCard>
      )}

      {!PFOS_QUICK_MODE && state.adim === 1 && (
        <ProCard
          title="İşletme konsepti"
          extra={
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setSeciliSegment(null);
                set({ adim: 0 });
              }}
            >
              Geri
            </Button>
          }
        >
          {konseptYukleniyor ? (
            <Spin />
          ) : konseptler.length === 0 ? (
            <Empty description="Konsept listesi boş" />
          ) : taxonomy && !seciliSegment ? (
            <Row gutter={[16, 16]}>
              {taxonomy.segments.map((s) => (
                <Col xs={24} sm={12} lg={8} key={s.key}>
                  <ProCard
                    hoverable
                    bordered
                    onClick={() => setSeciliSegment(s.key)}
                    style={{ height: "100%", borderRadius: "8px" }}
                  >
                    <Space align="center" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 20, color: "#34a853", display: "inline-flex" }}>
                        {SEGMENT_ICONS[s.icon || ""] || <AppstoreOutlined />}
                      </span>
                      <Typography.Text strong style={{ fontSize: 14 }}>
                        {s.label}
                      </Typography.Text>
                    </Space>
                    <div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {s.description}
                      </Typography.Text>
                    </div>
                  </ProCard>
                </Col>
              ))}
            </Row>
          ) : (
            <>
              {seciliSegment && taxonomy && (
                <div style={{ marginBottom: 16 }}>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setSeciliSegment(null);
                      set({ konsept: null });
                    }}
                  >
                    Tüm Segmentler
                  </Button>
                  <Typography.Title level={5} style={{ marginTop: 16 }}>
                    {taxonomy.segments.find((s) => s.key === seciliSegment)?.label} Alt Konseptleri
                  </Typography.Title>
                </div>
              )}
              <Row gutter={[12, 12]}>
                {(seciliSegment && taxonomy
                  ? konseptler.filter((k) =>
                      taxonomy.segments.find((s) => s.key === seciliSegment)?.concepts.includes(k.konsept)
                    )
                  : konseptler
                ).map((k) => {
                  const selected = state.konsept === k.konsept;
                  return (
                    <Col xs={24} sm={12} lg={8} key={k.konsept}>
                      <ProCard
                        hoverable
                        bordered
                        style={{
                          borderColor: selected ? "#1677ff" : undefined,
                          background: selected ? "#f0f5ff" : undefined,
                        }}
                        onClick={() => handleKonsept(k.konsept as Konsept)}
                      >
                        <Typography.Text strong>{k.label}</Typography.Text>
                        <div>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {k.ornekler.slice(0, 2).join(" · ")}
                          </Typography.Text>
                        </div>
                        <div>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {k.m2Min}–{k.m2Max} m² · {k.zorunluSayisi} zorunlu
                          </Typography.Text>
                        </div>
                      </ProCard>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
          {profil && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message={`Profil: ${profil.konseptUst} · ${profil.dukkan} — ${profil.pfosZones.length} mutfak bölümü`}
            />
          )}
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            disabled={!state.konsept}
            onClick={() => set({ adim: 2 })}
          >
            Devam — Alan & bölümler
          </Button>
        </ProCard>
      )}

      {(PFOS_QUICK_MODE ? state.konsept : state.adim === 2 && state.konsept) && (
        <ProCard
          title={PFOS_QUICK_MODE ? "Hızlı teklif" : "Alan ve mutfak bölümleri"}
          extra={
            !PFOS_QUICK_MODE ? (
              <Button
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => set({ adim: 1 })}
              >
                Geri
              </Button>
            ) : undefined
          }
        >
          <ProForm submitter={false} layout="vertical" requiredMark={false}>
            {!PFOS_QUICK_MODE && (
              <ProCard
                title="Teklif Detay Seviyesi"
                size="small"
                bordered
                style={{ marginBottom: 20, background: "rgba(241, 245, 249, 0.4)", borderRadius: "8px" }}
              >
                <ProFormRadio.Group
                  name="detaySeviyesi"
                  radioType="button"
                  fieldProps={{
                    value: state.detaySeviyesi,
                    onChange: (e) => {
                      const level = e.target.value as "hizli" | "standart" | "detayli";
                      set({
                        detaySeviyesi: level,
                        referansProjeId: level === "detayli" ? state.referansProjeId : null,
                        bolumM2: level === "detayli" ? state.bolumM2 : {},
                      });
                    },
                  }}
                  options={[
                    { label: "⚡ Hızlı Teklif", value: "hizli" },
                    { label: "📋 Standart Teklif", value: "standart" },
                    { label: "🔧 Detaylı Proje", value: "detayli" },
                  ]}
                />
              </ProCard>
            )}

            {PFOS_QUICK_MODE ? (
              <Row gutter={[16, 8]} style={{ marginBottom: 8 }}>
                <Col xs={24} md={14} lg={12}>
                  <ProFormSelect
                    label="Konsept"
                    showSearch
                    fieldProps={{
                      loading: konseptYukleniyor,
                      value: state.konsept ?? undefined,
                      options: konseptler.map((k) => ({
                        label: k.label,
                        value: k.konsept,
                      })),
                      onChange: (v) => handleKonsept(v as Konsept),
                    }}
                  />
                </Col>
                <Col xs={24} md={10} lg={8}>
                  <Form.Item label="Toplam alan (m²)" extra={m2ToplamExtra}>
                    <InputNumber
                      value={toplamM2 || undefined}
                      onChange={handleM2Toplam}
                      precision={0}
                      step={10}
                      style={{ width: "100%", maxWidth: 160 }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              <Form.Item label="Toplam alan (m²)" extra={m2ToplamExtra}>
                <InputNumber
                  value={toplamM2 || undefined}
                  onChange={handleM2Toplam}
                  precision={0}
                  step={10}
                  style={{ maxWidth: 200, width: "100%" }}
                />
              </Form.Item>
            )}

            {!PFOS_QUICK_MODE && state.detaySeviyesi !== "hizli" && (
              <Row gutter={[16, 16]} style={{ marginBottom: 20, marginTop: 16 }}>
                <Col xs={24} sm={12}>
                  <ProCard size="small" bordered style={{ background: "#fff", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Teşhir Vitrinleri Dahil Edilsin mi?</div>
                        <div style={{ fontSize: 11, color: "#666" }}>Börek, sütlü tatlı reyonları teklife eklenir.</div>
                      </div>
                      <Checkbox
                        checked={state.teshirVitrinleriDahil}
                        onChange={(e) => set({ teshirVitrinleriDahil: e.target.checked })}
                      />
                    </div>
                  </ProCard>
                </Col>
                <Col xs={24} sm={12}>
                  <ProCard size="small" bordered style={{ background: "#fff", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Yüksek Bulaşık Kapasitesi</div>
                        <div style={{ fontSize: 11, color: "#666" }}>Standart setaltı bulaşık makinesi giyotin modelle güncellenir.</div>
                      </div>
                      <Checkbox
                        checked={state.bulasikKapasitesiYuksek}
                        onChange={(e) => set({ bulasikKapasitesiYuksek: e.target.checked })}
                      />
                    </div>
                  </ProCard>
                </Col>
              </Row>
            )}

            {PFOS_QUICK_MODE && profil && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`${profil.konseptUst} · ${profil.dukkan} — ${profil.pfosZones.length} mutfak bölümü`}
              />
            )}

            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16, marginTop: 16 }}
              message="Teklif çıktısı: Excel proforma"
              description={`13 sütun proforma (Böl · Poz · Tanım · Marka · Ölçü · Elk · Gaz · Adet · Satış EUR). ${teklifMarkaPaneliOzeti()}`}
            />

            {!PFOS_QUICK_MODE && state.detaySeviyesi === "detayli" && referansProjeler.length > 0 && (
              <ProCard
                size="small"
                title="Referans mutfak projesi"
                style={{ marginBottom: 16 }}
                loading={referansYukleniyor}
              >
                <ProFormSelect
                  label="Arşiv proje"
                  showSearch
                  allowClear
                  options={[
                    { label: "— Manuel bölüm m² —", value: "" },
                    ...referansProjeler.map((p) => ({
                      label: `${p.baslik} (${p.zoneCount} bölüm)`,
                      value: p.id,
                    })),
                  ]}
                  fieldProps={{
                    value: state.referansProjeId ?? "",
                    placeholder: "S13-117 gibi onaylı proje seçin",
                    onChange: (v) => void applyReferansProje(v ? String(v) : null),
                  }}
                />
                {state.referansProjeId && state.referansBolumM2 && (
                  <>
                    <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                      Teklife dahil edilecek bölümler (m² proje planından)
                    </Typography.Text>
                    <Checkbox.Group
                      value={state.referansZoneSecimi}
                      style={{ width: "100%" }}
                    >
                      <Row gutter={[8, 8]}>
                        {Object.keys(state.referansBolumM2).map((z) => (
                          <Col xs={24} sm={12} md={8} key={z}>
                            <Checkbox
                              value={z}
                              onChange={(e) => toggleReferansZone(z, e.target.checked)}
                            >
                              {zoneLabel(z)}
                              {state.referansBolumM2[z]
                                ? ` (${state.referansBolumM2[z]} m²)`
                                : ""}
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Checkbox.Group>
                  </>
                )}
              </ProCard>
            )}

            <Row gutter={[16, 0]} style={{ marginBottom: 8 }}>
              <Col xs={24} md={14}>
                <ProFormText
                  label="Proje adı"
                  fieldProps={{
                    value: state.projeAdi,
                    onChange: (e) => set({ projeAdi: e.target.value }),
                    placeholder: seciliKonsept?.label ?? "Proje adı",
                  }}
                />
              </Col>
              <Col xs={24} md={10}>
                <ProFormText
                  label="Müşteri"
                  fieldProps={{
                    value: state.musteri,
                    onChange: (e) => set({ musteri: e.target.value }),
                    placeholder: "Müşteri / firma",
                  }}
                />
              </Col>
            </Row>
          </ProForm>

          {!PFOS_QUICK_MODE && state.detaySeviyesi === "detayli" && zones.length > 0 && toplamM2 > 0 && (
            <ProCard
              size="small"
              title="Bölüm m²"
              extra={
                <Button
                  size="small"
                  onClick={() => {
                    if (state.referansProjeId && state.referansZoneSecimi.length) {
                      set({
                        bolumM2: bolumFromReferansSecimi(
                          state.referansZoneSecimi,
                          state.referansBolumM2,
                        ),
                      });
                      return;
                    }
                    const z = profileZones;
                    if (toplamM2 > 0 && z.length) {
                      setState((s) => ({
                        ...s,
                        bolumM2: {
                          ...s.bolumM2,
                          ...dagitM2Toplam(z, toplamM2, s.konsept),
                        },
                      }));
                    }
                  }}
                >
                  Kurala göre dağıt
                </Button>
              }
              style={{ marginBottom: 16 }}
            >
              <Row gutter={[12, 12]}>
                {zones.map((z) => (
                  <Col xs={24} sm={12} md={8} key={z}>
                    <Form.Item label={zoneLabel(z)}>
                      <InputNumber
                        value={parseM2(state.bolumM2[z]) || undefined}
                        onChange={(v) =>
                          setState((s) => ({
                            ...s,
                            bolumM2: { ...s.bolumM2, [z]: v ?? "" },
                          }))
                        }
                        min={0}
                        precision={0}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
              {bolumToplam > 0 && (
                <Typography.Text
                  type={Math.abs(m2Fark) < 1 ? "success" : "warning"}
                >
                  Bölüm toplamı: {bolumToplam} m² (mutfak hedefi: {mutfakM2} m²)
                  {Math.abs(m2Fark) >= 1 &&
                    ` · Fark: ${m2Fark > 0 ? "+" : ""}${m2Fark} m²`}
                </Typography.Text>
              )}
            </ProCard>
          )}

          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              size="large"
              icon={<CalculatorOutlined />}
              disabled={!m2Ok}
              loading={yukleniyor}
              onClick={teklifOlustur}
            >
              Teklif oluştur
            </Button>
          </div>
        </ProCard>
      )}
    </Spin>
  );
}
