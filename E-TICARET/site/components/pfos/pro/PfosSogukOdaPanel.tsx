"use client";

import { CalculatorOutlined, PrinterOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import {
  Button,
  Checkbox,
  Col,
  Descriptions,
  Form,
  InputNumber,
  Row,
  Segmented,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";
import {
  TIP_DERIN_DONDURUCU_ODA,
  TIP_SOGUK_ODA,
  fmtTr,
  hesaplaSogukOda,
  hesaplaSogukOdaFiyat,
  type SogukOdaInput,
  type SogukOdaSonuc,
} from "@/lib/pfos/soguk-oda-calc";

type OdaCinsi = "soguk" | "derin";

const DEFAULT_INPUT: SogukOdaInput = {
  en: 3,
  boy: 4,
  yuk: 2.4,
  tip: TIP_SOGUK_ODA,
  zemin: "plywood",
  kapiTip: "menteseli_ithal",
  kapiOlcu: "90x190",
  kapiAdet: 1,
  cihazTip: "split",
  cihazAdet: 1,
};

function printSonuc(s: SogukOdaSonuc) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<html><body style="font-family:Arial;padding:24px">
    <h2>Soğuk Oda Teknik Hesap</h2>
    <p><b>Boyutlar:</b> ${s.en} × ${s.boy} × ${s.yuk} m</p>
    <p><b>Tür:</b> ${s.tipLabel} — Panel: ${s.panelKalin} cm</p>
    <p><b>Duvar:</b> ${fmtTr(s.duvarAlan)} m² | <b>Tavan:</b> ${fmtTr(s.tavanAlan)} m² | <b>Zemin:</b> ${fmtTr(s.zeminAlan)} m²</p>
    <p><b>Toplam Panel:</b> ${fmtTr(s.toplamPanel)} m² | <b>Hacim:</b> ${fmtTr(s.hacim)} m³</p>
    <p><b>Soğutma İhtiyacı:</b> ${s.sogutmaIhtiyacW.toLocaleString("tr-TR")} W</p>
    <p><b>Önerilen Cihaz:</b> ${s.cihazAdet}× ${s.cihaz?.model ?? "—"} (${s.cihazTip})</p>
    <script>window.print();<\/script></body></html>`);
  w.document.close();
}

export default function PfosSogukOdaPanel() {
  const [odaCinsi, setOdaCinsi] = useState<OdaCinsi>("soguk");
  const [input, setInput] = useState<SogukOdaInput>(DEFAULT_INPUT);
  const [extras, setExtras] = useState({
    ilaveKapi: false,
    havaPerdesi: false,
    basincVentil: false,
    guvenlikAlarm: false,
    nakliye: "dahil",
    bolge: "sehirici",
  });

  const sonuc = useMemo(() => hesaplaSogukOda(input), [input]);
  const fiyat = useMemo(
    () => (sonuc ? hesaplaSogukOdaFiyat(input, sonuc) : null),
    [input, sonuc],
  );

  const patch = (p: Partial<SogukOdaInput>) =>
    setInput((prev) => ({ ...prev, ...p }));

  const setOdaCinsiAndTip = (cinsi: OdaCinsi) => {
    setOdaCinsi(cinsi);
    patch({
      tip: cinsi === "derin" ? TIP_DERIN_DONDURUCU_ODA : TIP_SOGUK_ODA,
    });
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <ProCard title="Girişler" bordered>
          <Form layout="vertical" size="middle">
            <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Oda boyutları
            </Typography.Text>
            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col span={8}>
                <Form.Item label="En (m)">
                  <InputNumber
                    min={0.1}
                    step={0.1}
                    style={{ width: "100%" }}
                    value={input.en}
                    onChange={(v) => patch({ en: Number(v) || 0 })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Boy (m)">
                  <InputNumber
                    min={0.1}
                    step={0.1}
                    style={{ width: "100%" }}
                    value={input.boy}
                    onChange={(v) => patch({ boy: Number(v) || 0 })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Yükseklik (m)">
                  <InputNumber
                    min={0.1}
                    step={0.1}
                    style={{ width: "100%" }}
                    value={input.yuk}
                    onChange={(v) => patch({ yuk: Number(v) || 0 })}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Oda cinsi">
              <Segmented
                block
                value={odaCinsi}
                onChange={(v) => setOdaCinsiAndTip(v as OdaCinsi)}
                options={[
                  { value: "soguk", label: "Soğuk oda (+5°C)" },
                  { value: "derin", label: "Derin dondurucu oda (-18°C)" },
                ]}
              />
            </Form.Item>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="Zemin">
                  <Select
                    value={input.zemin}
                    onChange={(v) => patch({ zemin: v })}
                    options={[
                      { value: "plywood", label: "Panel + Plywood" },
                      { value: "styropor", label: "Styropor (Müşteri)" },
                      { value: "yok", label: "Zemin yok" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={8}>
                <Form.Item label="Kapı tipi">
                  <Select
                    value={input.kapiTip}
                    onChange={(v) => patch({ kapiTip: v })}
                    options={[
                      { value: "menteseli_yerli", label: "Menteşeli — yerli" },
                      { value: "menteseli_ithal", label: "Menteşeli — ithal" },
                      { value: "surgulu", label: "Sürgülü" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item label="Kapı ölçüsü">
                  <Select
                    value={input.kapiOlcu}
                    onChange={(v) => patch({ kapiOlcu: v })}
                    options={[
                      "70x170",
                      "80x180",
                      "80x190",
                      "90x190",
                      "100x200",
                      "120x200",
                      "140x200",
                      "160x220",
                      "180x220",
                      "200x220",
                    ].map((v) => ({ value: v, label: v.replace("x", "×") }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Adet">
                  <InputNumber
                    min={1}
                    max={4}
                    style={{ width: "100%" }}
                    value={input.kapiAdet}
                    onChange={(v) => patch({ kapiAdet: Number(v) || 1 })}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="Cihaz tipi">
                  <Select
                    value={input.cihazTip}
                    onChange={(v) => patch({ cihazTip: v })}
                    options={[
                      { value: "split", label: "Split" },
                      { value: "monoblok", label: "Monoblok" },
                      { value: "yok", label: "Cihaz yok (sadece oda)" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Cihaz adedi">
                  <Select
                    value={input.cihazAdet}
                    onChange={(v) => patch({ cihazAdet: Number(v) })}
                    options={[1, 2, 3].map((n) => ({ value: n, label: `${n} adet` }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={8}>
              <Col span={12}>
                <Form.Item label="Nakliye">
                  <Select
                    value={extras.nakliye}
                    onChange={(v) => setExtras((e) => ({ ...e, nakliye: v }))}
                    options={[
                      { value: "dahil", label: "Nakliye dahil" },
                      { value: "haric", label: "Nakliye hariç" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Bölge">
                  <Select
                    value={extras.bolge}
                    onChange={(v) => setExtras((e) => ({ ...e, bolge: v }))}
                    options={[
                      { value: "sehirici", label: "Şehiriçi" },
                      { value: "marmara", label: "Marmara" },
                      { value: "ege", label: "Ege" },
                      { value: "akdeniz", label: "Akdeniz" },
                      { value: "icaandolu", label: "İç Anadolu" },
                      { value: "b_karadeniz", label: "Batı Karadeniz" },
                      { value: "d_karadeniz", label: "Doğu Karadeniz" },
                      { value: "gdogu", label: "G.D.Anadolu" },
                      { value: "d_anadolu", label: "D.Anadolu" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Space wrap>
              <Checkbox
                checked={extras.ilaveKapi}
                onChange={(e) =>
                  setExtras((x) => ({ ...x, ilaveKapi: e.target.checked }))
                }
              >
                İlave kapı
              </Checkbox>
              <Checkbox
                checked={extras.havaPerdesi}
                onChange={(e) =>
                  setExtras((x) => ({ ...x, havaPerdesi: e.target.checked }))
                }
              >
                Hava perdesi
              </Checkbox>
              <Checkbox
                checked={extras.basincVentil}
                onChange={(e) =>
                  setExtras((x) => ({ ...x, basincVentil: e.target.checked }))
                }
              >
                Basınç ventili
              </Checkbox>
              <Checkbox
                checked={extras.guvenlikAlarm}
                onChange={(e) =>
                  setExtras((x) => ({ ...x, guvenlikAlarm: e.target.checked }))
                }
              >
                Kapı güvenlik alarmı
              </Checkbox>
            </Space>
          </Form>
        </ProCard>
      </Col>

      <Col xs={24} lg={12}>
        <ProCard
          title="Hesaplama sonuçları"
          bordered
          extra={<CalculatorOutlined />}
        >
          {!sonuc ? (
            <Typography.Text type="secondary">
              En, boy ve yükseklik girin.
            </Typography.Text>
          ) : (
            <>
              <Descriptions
                column={1}
                size="small"
                bordered
                title="Alan hesabı"
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label="Duvar yüzeyi">
                  {fmtTr(sonuc.duvarAlan)} m²
                </Descriptions.Item>
                <Descriptions.Item label="Tavan yüzeyi">
                  {fmtTr(sonuc.tavanAlan)} m²
                </Descriptions.Item>
                <Descriptions.Item label="Zemin yüzeyi">
                  {fmtTr(sonuc.zeminAlan)} m²
                </Descriptions.Item>
                <Descriptions.Item label="Toplam panel">
                  <Typography.Text strong>{fmtTr(sonuc.toplamPanel)} m²</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Oda hacmi">
                  {fmtTr(sonuc.hacim)} m³
                </Descriptions.Item>
                <Descriptions.Item label="Oda türü">{sonuc.tipLabel}</Descriptions.Item>
                <Descriptions.Item label="Panel kalınlığı">
                  {sonuc.panelKalin} cm
                </Descriptions.Item>
                <Descriptions.Item label="Zemin">{sonuc.zeminLabel}</Descriptions.Item>
                <Descriptions.Item label="Kapı">
                  {sonuc.kapiAdet}× {sonuc.kapiOlcu.replace("x", "×")} — {sonuc.kapiTip}
                </Descriptions.Item>
              </Descriptions>

              {fiyat ? (
                <Descriptions
                  column={1}
                  size="small"
                  bordered
                  title="Fiyat tahmini (KDV dahil)"
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions.Item label="Panel + cihaz">
                    <Typography.Text strong style={{ fontSize: 16 }}>
                      ₺{fiyat.fiyatTl.toLocaleString("tr-TR")}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Panel alanı">
                    {fmtTr(sonuc.toplamPanel)} m² × ₺
                    {fiyat.birimTlM2.toLocaleString("tr-TR")}/m²
                  </Descriptions.Item>
                  <Descriptions.Item label="Ölçü">
                    {fmtTr(sonuc.en, 1)}×{fmtTr(sonuc.boy, 1)}×{fmtTr(sonuc.yuk, 1)} m
                  </Descriptions.Item>
                </Descriptions>
              ) : null}

              {sonuc.cihazTip !== "yok" && sonuc.cihaz ? (
                <Descriptions
                  column={1}
                  size="small"
                  bordered
                  title={`Soğutma cihazı (${sonuc.cihazAdet}× ${sonuc.cihazTip})`}
                >
                  <Descriptions.Item label="Soğutma ihtiyacı">
                    <Typography.Text strong>
                      {sonuc.sogutmaIhtiyacW.toLocaleString("tr-TR")} W
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Önerilen model">
                    {sonuc.cihaz.model}
                  </Descriptions.Item>
                  <Descriptions.Item label="Kapasite">
                    {sonuc.cihaz.kapasite.toLocaleString("tr-TR")} W
                  </Descriptions.Item>
                  <Descriptions.Item label="Motor gücü">
                    {sonuc.cihaz.guc_hp} Hp
                  </Descriptions.Item>
                  <Descriptions.Item label="Elektrik">
                    {sonuc.cihaz.elk_w.toLocaleString("tr-TR")} W
                  </Descriptions.Item>
                  <Descriptions.Item label="Maks. soğutma hacmi">
                    {sonuc.maxSogutmaHacim} m³
                  </Descriptions.Item>
                  <Descriptions.Item label="Rejim">
                    220/380 V — R404A
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Typography.Text type="secondary">Cihaz seçilmedi.</Typography.Text>
              )}

              <Space style={{ marginTop: 16 }} wrap>
                <Button
                  type="primary"
                  onClick={() => {
                    const fiyatSatir = fiyat
                      ? `\nFiyat: ₺${fiyat.fiyatTl.toLocaleString("tr-TR")} (KDV dahil)`
                      : "";
                    message.info(
                      `${sonuc.en}×${sonuc.boy}×${sonuc.yuk} m — ${sonuc.tipLabel}\nPanel: ${sonuc.panelKalin} cm, ${fmtTr(sonuc.toplamPanel)} m²\nCihaz: ${sonuc.cihazAdet}× ${sonuc.cihaz?.model ?? "—"}${fiyatSatir}`,
                      6,
                    );
                  }}
                >
                  Teklife not olarak kopyala
                </Button>
                <Button icon={<PrinterOutlined />} onClick={() => printSonuc(sonuc)}>
                  Yazdır
                </Button>
              </Space>
            </>
          )}
        </ProCard>
      </Col>
    </Row>
  );
}
