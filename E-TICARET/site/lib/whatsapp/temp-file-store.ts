import { randomUUID } from "node:crypto";

type TempEntry = {
  buf: Buffer;
  fileName: string;
  contentType: string;
  exp: number;
};

const store = new Map<string, TempEntry>();
const TTL_MS = 15 * 60_000;

function sweep(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.exp <= now) store.delete(id);
  }
}

/** Kısa ömürlü public PDF — Green API sendFileByUrl için */
export function putTempWhatsAppFile(
  buf: Buffer,
  fileName: string,
  contentType = "application/pdf",
): string {
  sweep();
  const id = randomUUID().replace(/-/g, "");
  store.set(id, {
    buf,
    fileName,
    contentType,
    exp: Date.now() + TTL_MS,
  });
  return id;
}

export function getTempWhatsAppFile(id: string): TempEntry | null {
  sweep();
  const key = String(id || "").trim();
  if (!/^[a-f0-9]{32}$/i.test(key)) return null;
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.exp <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry;
}

export function deleteTempWhatsAppFile(id: string): void {
  store.delete(String(id || "").trim());
}
