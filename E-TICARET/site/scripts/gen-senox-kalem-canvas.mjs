#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/data/senox/mutbex-kalem-kalem.json"), "utf8"),
);
const compact = data.rows.map((r) => [
  r.sira,
  r.model,
  r.sku,
  r.dept,
  r.durum,
  r.kaynak,
  r.pdf_liste_eur,
  r.mutbex_liste_eur,
  r.fark_eur,
  r.fark_yuzde,
  r.equsto_satis_eur,
  r.equsto_tl,
]);

const canvas = `import { Card, CardBody, CardHeader, H1, Stack, Table, Text, useHostTheme } from "cursor/canvas";

const ROWS = ${JSON.stringify(compact)} as const;

export default function SenoxKalemKalem() {
  useHostTheme();
  return (
    <Stack gap={16}>
      <H1>Şenox — kalem kalem PDF vs Mutbex</H1>
      <Text tone="muted">
        214 ürün · Equsto satış = liste × 50% · Fark = Mutbex liste − PDF liste · ${data.generatedAt.slice(0, 10)}
      </Text>
      <Card>
        <CardHeader title="Tüm ürünler (${compact.length} satır)" />
        <CardBody padding={0}>
          <Table
            columns={[
              { key: "sira", header: "#", width: "4%" },
              { key: "model", header: "Model", width: "9%" },
              { key: "sku", header: "SKU", width: "10%" },
              { key: "dept", header: "Dept", width: "8%" },
              { key: "durum", header: "Durum", width: "11%" },
              { key: "kaynak", header: "Kaynak", width: "7%" },
              { key: "pdf", header: "PDF liste", align: "right" },
              { key: "mut", header: "Mut liste", align: "right" },
              { key: "fark", header: "Fark EUR", align: "right" },
              { key: "pct", header: "Fark %", align: "right" },
              { key: "satis", header: "Equsto satış", align: "right" },
              { key: "tl", header: "TL", align: "right" },
            ]}
            rows={ROWS.map((r) => ({
              sira: String(r[0]),
              model: String(r[1]),
              sku: String(r[2]),
              dept: String(r[3]),
              durum: String(r[4]),
              kaynak: String(r[5]),
              pdf: r[6] != null ? Number(r[6]).toLocaleString("tr-TR") : "—",
              mut: r[7] != null ? Number(r[7]).toLocaleString("tr-TR") : "—",
              fark: r[8] != null ? Number(r[8]).toLocaleString("tr-TR") : "—",
              pct: r[9] != null ? r[9] + "%" : "—",
              satis: r[10] != null ? Number(r[10]).toLocaleString("tr-TR") + " EUR" : "—",
              tl: r[11] != null ? "₺" + Number(r[11]).toLocaleString("tr-TR") : "—",
            }))}
          />
        </CardBody>
      </Card>
    </Stack>
  );
}
`;

const out = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-D-Disk-EQUSTO-WORK/canvases/senox-kalem-kalem.canvas.tsx",
);
fs.writeFileSync(out, canvas, "utf8");
console.log("[canvas]", out, compact.length, "satır");
