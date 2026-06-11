import { resolveSlotsForCell } from "../lib/pfos/core/rules/kafe/slots.ts";
import { listKafeCells } from "../lib/pfos/core/matrix/kafe-resolver.ts";

async function main() {
  console.log("=== KAFE MATRİS (rules slot sayısı) ===\n");
  for (const cell of listKafeCells()) {
    const slots = resolveSlotsForCell(cell.yogunluk);
    const seed = cell.referansSeed?.listeDosya ?? "—";
    console.log(
      `${cell.id.padEnd(28)} slots=${String(slots.length).padStart(2)}  seed=${seed}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
