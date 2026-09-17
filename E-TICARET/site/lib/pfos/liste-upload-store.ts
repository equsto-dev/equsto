import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

export type ListeUploadKind = "pdf" | "excel";

export type ListeUploadAdminRef = {
  id: string;
  original_name: string;
};

function uploadRoot(): string {
  const env = process.env.PFOS_LISTE_UPLOAD_DIR?.trim();
  if (env) return path.resolve(env);
  return path.join(process.cwd(), "data", "liste-uploads");
}

function extFor(originalName: string, kind: ListeUploadKind): string {
  if (kind === "pdf") return "pdf";
  if (/\.xls$/i.test(originalName) && !/\.xlsx$/i.test(originalName)) return "xls";
  return "xlsx";
}

function mimeFor(kind: ListeUploadKind, ext: string): string {
  if (kind === "pdf" || ext === "pdf") return "application/pdf";
  if (ext === "xls") return "application/vnd.ms-excel";
  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}

function assertInsideRoot(root: string, target: string) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Geçersiz dosya yolu");
  }
}

export async function persistListeUpload(opts: {
  bytes: Uint8Array;
  originalName: string;
  kind: ListeUploadKind;
  memberId?: string | null;
}): Promise<{ id: string; originalName: string } | null> {
  const originalName = (opts.originalName || "liste").trim() || "liste";
  const ext = extFor(originalName, opts.kind);
  const mime = mimeFor(opts.kind, ext);
  const size = opts.bytes.byteLength;

  let row: { id: string };
  try {
    row = await db.pfosListeUpload.create({
      data: {
        originalName,
        storedRel: "pending",
        mime,
        kind: opts.kind,
        bytes: size,
        memberId: opts.memberId?.trim() || null,
      },
      select: { id: true },
    });
  } catch (e) {
    console.error("[pfos-liste-upload] db create", e);
    return null;
  }

  const now = new Date();
  const storedRel = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${row.id}.${ext}`;
  const abs = path.join(uploadRoot(), storedRel);
  try {
    assertInsideRoot(uploadRoot(), abs);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, opts.bytes);
    await db.pfosListeUpload.update({
      where: { id: row.id },
      data: { storedRel },
    });
    return { id: row.id, originalName };
  } catch (e) {
    console.error("[pfos-liste-upload] write", e);
    await db.pfosListeUpload.delete({ where: { id: row.id } }).catch(() => {});
    return null;
  }
}

export async function linkListeUpload(opts: {
  id?: string | null;
  teklifSayi?: string | null;
  snapshotId?: string | null;
}): Promise<void> {
  const id = String(opts.id ?? "").trim();
  if (!id) return;
  const teklifSayi = String(opts.teklifSayi ?? "").trim();
  const snapshotId = String(opts.snapshotId ?? "").trim() || null;
  if (!teklifSayi && !snapshotId) return;

  try {
    await db.pfosListeUpload.update({
      where: { id },
      data: {
        ...(teklifSayi ? { teklifSayi } : {}),
        ...(snapshotId ? { snapshotId } : {}),
      },
    });
  } catch (e) {
    console.error("[pfos-liste-upload] link", e);
  }
}

export async function kaynakUploadsByTeklifSayi(
  sayilar: string[],
): Promise<Map<string, ListeUploadAdminRef>> {
  const keys = [...new Set(sayilar.map((s) => s.trim()).filter(Boolean))];
  const map = new Map<string, ListeUploadAdminRef>();
  if (!keys.length) return map;
  try {
    const rows = await db.pfosListeUpload.findMany({
      where: { teklifSayi: { in: keys } },
      orderBy: { createdAt: "desc" },
      select: { id: true, originalName: true, teklifSayi: true },
    });
    for (const r of rows) {
      const key = r.teklifSayi.trim();
      if (!key || map.has(key)) continue;
      map.set(key, { id: r.id, original_name: r.originalName });
    }
  } catch (e) {
    console.error("[pfos-liste-upload] lookup", e);
  }
  return map;
}

export async function readListeUploadFile(id: string): Promise<{
  buffer: Buffer;
  originalName: string;
  mime: string;
} | null> {
  const row = await db.pfosListeUpload.findUnique({ where: { id: id.trim() } });
  if (!row || !row.storedRel || row.storedRel === "pending") return null;
  const abs = path.join(uploadRoot(), row.storedRel);
  assertInsideRoot(uploadRoot(), abs);
  const buffer = await readFile(abs);
  return {
    buffer,
    originalName: row.originalName,
    mime: row.mime || mimeFor(row.kind === "excel" ? "excel" : "pdf", path.extname(row.storedRel).slice(1)),
  };
}
