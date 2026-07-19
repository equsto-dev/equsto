#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "scripts/data/catalog-agent/full-report-rows.json"),
    "utf8",
  ),
);

const rows = src.rows.map((x) => ({
  n: x.n,
  sev: x.sev,
  layer: x.layer,
  brand: x.brand,
  sku: x.sku,
  site: x.site,
  expected: x.expected,
  diff: x.diff,
  msg: String(x.msg || "").slice(0, 140),
  dept: x.dept || "",
}));

const brands = [...new Set(rows.map((r) => r.brand))].sort((a, b) =>
  a.localeCompare(b, "tr"),
);

const meta = {
  generatedAt: src.generatedAt,
  status: src.status,
  kur: src.kur,
  usdTry: src.usdTry,
  summary: src.summary,
  brands,
};

const outPath = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-D-Disk-EQUSTO-WORK/canvases/katalog-fiyat-raporu.canvas.tsx",
);

const code = `import {
  Callout,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Select,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  useCanvasState,
} from "cursor/canvas";

const META = ${JSON.stringify(meta)} as const;
const ROWS = ${JSON.stringify(rows)} as const;

const PAGE = 40;

function fmtTl(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return "₺" + Math.round(Number(n)).toLocaleString("tr-TR");
}

function sevTone(sev: string): "danger" | "warning" | "info" | undefined {
  if (sev === "critical") return "danger";
  if (sev === "high") return "warning";
  if (sev === "medium") return "info";
  return undefined;
}

export default function KatalogFiyatRaporu() {
  const [sev, setSev] = useCanvasState("sev", "all");
  const [layer, setLayer] = useCanvasState("layer", "all");
  const [brand, setBrand] = useCanvasState("brand", "all");
  const [q, setQ] = useCanvasState("q", "");
  const [page, setPage] = useCanvasState("page", 0);

  const filtered = ROWS.filter((r) => {
    if (sev !== "all" && r.sev !== sev) return false;
    if (layer !== "all" && r.layer !== layer) return false;
    if (brand !== "all" && r.brand !== brand) return false;
    if (q.trim()) {
      const needle = q.trim().toLocaleLowerCase("tr");
      const hay = (r.sku + " " + r.brand + " " + r.msg + " " + r.dept).toLocaleLowerCase("tr");
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(Math.max(0, page), pages - 1);
  const slice = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const s = META.summary;

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 1200 }}>
      <Stack gap={6}>
        <H1>Katalog fiyat denetimi — kalem kalem</H1>
        <Text tone="secondary" size="small">
          Kaynak: catalog-agent full-report · {META.generatedAt} · durum{" "}
          {META.status} · EUR {META.kur} / USD {META.usdTry}
        </Text>
      </Stack>

      <Grid columns={5} gap={12}>
        <Stat value={String(s.totalIssues)} label="Toplam sorun" />
        <Stat value={String(s.critical)} label="Critical" tone="danger" />
        <Stat value={String(s.high)} label="High" tone="warning" />
        <Stat value={String(s.medium)} label="Medium" tone="info" />
        <Stat value={String(s.low)} label="Low" />
      </Grid>

      <Callout tone="info" title="2167 kalem">
        Severity, katman, marka ve SKU araması ile daraltın. Sayfa başı 40 satır.
      </Callout>

      <Row gap={8} wrap>
        {(["all", "critical", "high", "medium", "low"] as const).map((k) => (
          <Pill
            key={k}
            active={sev === k}
            onClick={() => {
              setSev(k);
              setPage(0);
            }}
          >
            {k === "all" ? "Tüm severity" : k}
          </Pill>
        ))}
      </Row>
      <Row gap={8} wrap>
        {(["all", "L1", "L2", "L3", "L4", "brand"] as const).map((k) => (
          <Pill
            key={k}
            active={layer === k}
            onClick={() => {
              setLayer(k);
              setPage(0);
            }}
          >
            {k === "all" ? "Tüm katman" : k === "brand" ? "Marka özel" : k}
          </Pill>
        ))}
      </Row>

      <Row gap={12} wrap>
        <Select
          value={brand}
          onChange={(v) => {
            setBrand(v);
            setPage(0);
          }}
          options={[
            { value: "all", label: "Tüm markalar" },
            ...META.brands.map((b) => ({ value: b, label: b })),
          ]}
        />
        <TextInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(0);
          }}
          placeholder="SKU / marka / mesaj ara…"
        />
      </Row>

      <H2>
        Kalemler ({filtered.length} / {ROWS.length}) — sayfa {safePage + 1}/
        {pages}
      </H2>

      <Table
        stickyHeader
        striped
        headers={[
          "#",
          "Sev",
          "Katman",
          "Marka",
          "SKU",
          "Site TL",
          "Beklenen",
          "Fark",
          "Mesaj",
        ]}
        columnAlign={[
          "right",
          "left",
          "left",
          "left",
          "left",
          "right",
          "right",
          "right",
          "left",
        ]}
        rowTone={slice.map((r) => sevTone(r.sev))}
        rows={slice.map((r) => [
          String(r.n),
          r.sev,
          r.layer,
          r.brand,
          r.sku,
          fmtTl(r.site),
          fmtTl(r.expected),
          fmtTl(r.diff),
          r.msg,
        ])}
        emptyMessage="Filtreye uyan kalem yok"
      />

      <Row gap={8}>
        <Pill
          disabled={safePage <= 0}
          onClick={() => setPage(Math.max(0, safePage - 1))}
        >
          Önceki
        </Pill>
        <Text tone="secondary">
          Sayfa {safePage + 1} / {pages}
        </Text>
        <Pill
          disabled={safePage >= pages - 1}
          onClick={() => setPage(Math.min(pages - 1, safePage + 1))}
        >
          Sonraki
        </Pill>
      </Row>

      <Divider />
      <Text tone="secondary" size="small">
        L1 formül · L2 kaynak · L3 oran/piyasa · L4 anomali · Marka özel =
        Senox/Portabianco vb.
      </Text>
    </Stack>
  );
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, code, "utf8");
console.log("wrote", outPath, fs.statSync(outPath).size, "bytes");
