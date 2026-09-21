import assert from "node:assert/strict";
import { describe, it } from "node:test";
import ExcelJS from "exceljs";
import {
  parseTabularProformaWorksheet,
  pickBestProformaRows,
  pickBestProformaWorkbook,
} from "./liste-proforma-excel";

function sheetFromRows(rows: unknown[][], name = "Liste") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(name);
  for (const row of rows) ws.addRow(row);
  return { wb, ws };
}

describe("parseTabularProformaWorksheet — Poz sütunu", () => {
  it("reads classic Poz | Tanım | Ölçü | Adet", () => {
    const { ws } = sheetFromRows([
      ["Poz", "Tanım", "Ölçü", "Adet"],
      ["A1", "Kuzine gazlı 4 gözlü", "90*90*85", 1],
      ["A2", "Fritöz 12 litre", "40*70*90", 2],
    ]);
    const rows = parseTabularProformaWorksheet(ws);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.poz, "A1");
    assert.match(rows[0]?.ad ?? "", /Kuzine/i);
    assert.equal(rows[1]?.adet, 2);
  });
});

describe("pickBestProformaRows — Poz olmadan müşteri Excel", () => {
  it("reads Ürün | Adet without Poz (2021-003 class)", () => {
    const { ws } = sheetFromRows([
      ["Ürün", "Adet"],
      ["Gazlı kuzine 4 gözlü", 1],
      ["Tezgah tipi buzdolabı", 2],
      ["Salamander ızgara", 1],
    ]);
    const rows = pickBestProformaRows(ws);
    assert.equal(rows.length, 3);
    assert.equal(rows[0]?.poz, "A1");
    assert.match(rows[0]?.ad ?? "", /kuzine/i);
    assert.equal(rows[1]?.adet, 2);
    assert.match(rows[1]?.ad ?? "", /buzdolab/i);
  });

  it("reads No | Malzeme Cinsi | Adet without Poz", () => {
    const { ws } = sheetFromRows([
      ["No", "Malzeme Cinsi", "Adet"],
      [1, "Kombine fırın 10 GN", 1],
      [2, "Bulaşık makinesi konveyör", 1],
    ]);
    const rows = pickBestProformaRows(ws);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.poz, "1");
    assert.match(rows[0]?.ad ?? "", /fırın|firin/i);
  });

  it("reads headerless name + qty lists", () => {
    const { ws } = sheetFromRows([
      ["Gazlı kuzine 4 gözlü", 1],
      ["Tezgah tipi buzdolabı", 2],
      ["Konveyör bulaşık makinesi", 1],
    ]);
    const rows = pickBestProformaRows(ws);
    assert.ok(rows.length >= 3, `expected ≥3 rows, got ${rows.length}`);
    assert.ok(rows.some((r) => /kuzine/i.test(r.ad)));
    assert.ok(rows.some((r) => Number(r.adet) === 2));
  });
});

describe("pickBestProformaWorkbook — kapak + 2. sayfa", () => {
  it("uses the sheet that actually has the list", () => {
    const { wb } = sheetFromRows([["Proje 2021-003"], ["Kapak"]], "Kapak");
    const ws2 = wb.addWorksheet("Liste");
    ws2.addRow(["Ürün", "Adet"]);
    ws2.addRow(["Gazlı kuzine 4 gözlü", 1]);
    ws2.addRow(["Tezgah tipi buzdolabı", 2]);
    const rows = pickBestProformaWorkbook(wb);
    assert.equal(rows.length, 2);
    assert.match(rows[0]?.ad ?? "", /kuzine/i);
  });
});
