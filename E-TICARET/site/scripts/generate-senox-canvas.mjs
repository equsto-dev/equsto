#!/usr/bin/env node
/** JSON karşılaştırma verisinden canvas dosyası üretir */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_PATH = path.join(ROOT, "scripts/data/senox-multi-market-karsilastirma.json");
const OUT = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-D-Disk-EQUSTO-WORK/canvases/senox-fiyat-karsilastirma.canvas.tsx",
);

const { summary, rows } = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

const compactRows = rows.map((r) => [
  String(r.model || r.key || "").trim(),
  r.sku,
  r.prices.equsto,
  r.prices.kariyer,
  r.prices.cafemarkt,
  r.matched.kariyer,
  r.matched.cafemarkt,
  r.cheapest,
  r.in_equsto,
]);

const src = `import {
  Checkbox,
  Grid,
  H1,
  H2,
  Row,
  Select,
  Stack,
  Stat,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type RowTuple = [
  string,
  string,
  number | null,
  number | null,
  number | null,
  boolean,
  boolean,
  string | null,
  boolean,
];

const SUMMARY = ${JSON.stringify(summary, null, 2)} as const;

const ROWS: RowTuple[] = ${JSON.stringify(compactRows)};

type SortKey = "model" | "equsto" | "kariyer" | "cafemarkt" | "diff";

function fmtPrice(n: number | null): string {
  if (n == null || !(n > 0)) return "—";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";
}

export default function SenoxFiyatKarsilastirma() {
  const { accent } = useHostTheme();
  const [matchedOnly, setMatchedOnly] = useCanvasState("matchedOnly", false);
  const [sortKey, setSortKey] = useCanvasState<SortKey>("sortKey", "model");
  const [sortDir, setSortDir] = useCanvasState<"asc" | "desc">("sortDir", "asc");

  const filtered = ROWS.filter((r) => {
    if (!matchedOnly) return true;
    return r[5] || r[6];
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = "";
    let bv: string | number = "";
    if (sortKey === "model") {
      av = a[0];
      bv = b[0];
    } else if (sortKey === "equsto") {
      av = a[2] ?? -1;
      bv = b[2] ?? -1;
    } else if (sortKey === "kariyer") {
      av = a[3] ?? -1;
      bv = b[3] ?? -1;
    } else if (sortKey === "cafemarkt") {
      av = a[4] ?? -1;
      bv = b[4] ?? -1;
    } else {
      const aPrices = [a[2], a[3], a[4]].filter((p): p is number => p != null && p > 0);
      const bPrices = [b[2], b[3], b[4]].filter((p): p is number => p != null && p > 0);
      av = aPrices.length ? Math.min(...aPrices) - (a[2] ?? 0) : 0;
      bv = bPrices.length ? Math.min(...bPrices) - (b[2] ?? 0) : 0;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const tableRows = sorted.map((r) => {
    const [model, sku, eq, k, c, , , cheapest] = r;
    const eqStyle = cheapest === "equsto" ? { color: accent.primary, fontWeight: 600 as const } : undefined;
    const kStyle = cheapest === "kariyer" ? { color: accent.primary, fontWeight: 600 as const } : undefined;
    const cStyle = cheapest === "cafemarkt" ? { color: accent.primary, fontWeight: 600 as const } : undefined;
    return [
      <Stack gap={2} key={model + sku}>
        <Text weight="semibold">{model}</Text>
        <Text tone="tertiary" size="small">
          {sku}
        </Text>
      </Stack>,
      <Text style={eqStyle}>{fmtPrice(eq)}</Text>,
      <Text style={kStyle}>{fmtPrice(k)}</Text>,
      <Text style={cStyle}>{fmtPrice(c)}</Text>,
    ];
  });

  const rowTones = sorted.map((r) => {
    if (r[7] === "equsto") return "success" as const;
    if (r[7] === "kariyer" || r[7] === "cafemarkt") return "warning" as const;
    return undefined;
  });

  const date = SUMMARY.generated_at.slice(0, 10);

  return (
    <Stack gap={20}>
      <Stack gap={6}>
        <H1>Şenox fiyat karşılaştırması</H1>
        <Text tone="secondary">
          Equsto.com · Kariyer Mutfak · Cafemarkt · KDV dahil TL · {date}
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat label="Karşılaştırılan satır" value={String(SUMMARY.total_rows)} />
        <Stat
          label="Her iki rakipte eşleşen"
          value={String(SUMMARY.matched_both)}
          tone="accent"
        />
        <Stat
          label="Equsto en ucuz (eşleşenlerde)"
          value={\`\${SUMMARY.equsto_cheapest_pct_of_matched ?? 0}%\`}
          tone="success"
        />
        <Stat
          label="Ort. Equsto vs Cafemarkt"
          value={\`\${SUMMARY.avg_equsto_vs_cafemarkt_pct ?? 0}%\`}
        />
      </Grid>

      <Grid columns={4} gap={12}>
        <Stat label="Equsto katalog" value={String(SUMMARY.equsto_count)} />
        <Stat label="Cafemarkt eşleşme" value={String(SUMMARY.matched_cafemarkt)} />
        <Stat label="Kariyer eşleşme" value={String(SUMMARY.matched_kariyer)} />
        <Stat
          label="Sadece Cafemarkt'ta"
          value={String(SUMMARY.cafe_only_rows)}
          tone="warning"
        />
      </Grid>

      <Stack gap={10}>
        <H2>Fiyat tablosu</H2>
        <Row gap={12} align="center" wrap>
          <Checkbox
            checked={matchedOnly}
            onChange={setMatchedOnly}
            label="Yalnızca rakipte bulunanlar"
          />
          <Select
            value={sortKey}
            onChange={(v) => setSortKey(v as SortKey)}
            options={[
              { value: "model", label: "Model A→Z" },
              { value: "equsto", label: "Equsto fiyat" },
              { value: "kariyer", label: "Kariyer fiyat" },
              { value: "cafemarkt", label: "Cafemarkt fiyat" },
              { value: "diff", label: "Equsto avantajı" },
            ]}
          />
          <Select
            value={sortDir}
            onChange={(v) => setSortDir(v as "asc" | "desc")}
            options={[
              { value: "asc", label: "Artan" },
              { value: "desc", label: "Azalan" },
            ]}
          />
          <Text tone="tertiary" size="small">
            {sorted.length} satır · vurgulu hücre = satırda en ucuz
          </Text>
        </Row>
        <Table
          headers={["Ürün / Model", "Equsto", "Kariyer Mutfak", "Cafemarkt"]}
          rows={tableRows}
          rowTone={rowTones}
          columnAlign={["left", "right", "right", "right"]}
          striped
          stickyHeader
          framed
        />
        <Text tone="tertiary" size="small">
          Kaynak: equsto.com/arama?q=şenox · kariyermutfak.com/senox · cafemarkt.com/senox ·{" "}
          {SUMMARY.generated_at.replace("T", " ").slice(0, 19)} UTC
        </Text>
      </Stack>
    </Stack>
  );
}
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, src, "utf8");
console.log("→", OUT, `(${rows.length} rows)`);
