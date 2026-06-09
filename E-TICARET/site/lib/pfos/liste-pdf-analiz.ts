/**
 * PDF teklif listesi → Claude analiz (sunucu tarafı, public liste-fiyat için).
 */

import { adminLoginToken } from "@/lib/admin-auth";
import { loadTipSozluguEntries } from "@/lib/tip-sozlugu/store";
import type { TipSozlukEntry } from "@/lib/tip-sozlugu/types";

const PROXY_BASE = (
  process.env.CLAUDE_API_PROXY_URL ||
  process.env.EQUSTO_CLAUDE_API_BASE ||
  "http://127.0.0.1:3001/api"
).replace(/\/$/, "");

export type ListePdfKalem = {
  ham_isim: string;
  tip_kodu: string;
  kategori: string;
  adet?: number;
  poz?: string;
  olcu?: string;
};

function buildSystemPrompt(entries: TipSozlukEntry[]): string {
  const tipListesi = entries
    .map((t) => `${t.tip_kodu} → ${t.aciklama} (${t.kategori})`)
    .join("\n");

  return `Sen bir endüstriyel mutfak ekipmanı uzmanısın.
Kullanıcı sana bir PDF teklif / proforma / ekipman listesi yükleyecek.
Bu dosyadan ekipman kalemlerini çıkar ve aşağıdaki tip_sozlugu ile eşleştir.

TİP SÖZLÜĞÜ (mevcut):
${tipListesi}

GÖREV:
1. Dosyadaki her ekipman kalemini tespit et (adet ve ölçü varsa al)
2. Mevcut tip_sozlugu'ndan en uygun tip_kodu'nu bul
3. Uygun yoksa yeni bir tip_kodu öner (snake_case, Türkçe karaktersiz)
4. Her kalem için kategori: pisirme / icecek / sogutma / yikama / hazirlik / tezgah_davlumbaz / depolama / diger

SADECE JSON dizi döndür:
[
  {
    "ham_isim": "dosyadan gelen orijinal metin",
    "tip_kodu": "mevcut_veya_yeni_kod",
    "kategori": "kategori_adi",
    "adet": 1,
    "poz": "A1 veya satır no",
    "olcu": "152*46*160 veya null",
    "durum": "eslesti" | "yeni" | "belirsiz"
  }
]`;
}

function parseProxyItems(raw: unknown): ListePdfKalem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => {
      const row = x as Record<string, unknown>;
      const ham_isim = String(row.ham_isim ?? row.name ?? "").trim();
      const tip_kodu = String(row.tip_kodu ?? row.tip ?? "").trim();
      if (!ham_isim || !tip_kodu) return null;
      const adetRaw = row.adet;
      const adet =
        typeof adetRaw === "number" && adetRaw > 0
          ? Math.round(adetRaw)
          : parseInt(String(adetRaw ?? "1"), 10) || 1;
      return {
        ham_isim,
        tip_kodu,
        kategori: String(row.kategori ?? row.cat ?? "diger").trim() || "diger",
        adet,
        poz: row.poz != null ? String(row.poz).trim() : undefined,
        olcu:
          row.olcu != null && String(row.olcu).trim()
            ? String(row.olcu).trim()
            : undefined,
      } satisfies ListePdfKalem;
    })
    .filter((x): x is ListePdfKalem => x !== null);
}

/** PDF buffer → ekipman kalemleri (Claude proxy) */
export async function analyzePdfForListe(
  pdfBuffer: ArrayBuffer,
  opts?: { notlar?: string },
): Promise<ListePdfKalem[]> {
  const entries = await loadTipSozluguEntries();
  const system_prompt = buildSystemPrompt(entries);

  const trimmedNotes = opts?.notlar?.trim();
  const user_prompt = trimmedNotes
    ? `Dosyayı analiz et.\n\nListe notları:\n---\n${trimmedNotes}\n---`
    : "Dosyayı analiz et ve tüm ekipman kalemlerini çıkar:";

  const token = adminLoginToken();
  const body = JSON.stringify({
    dosya_base64: Buffer.from(pdfBuffer).toString("base64"),
    dosya_tip: "application/pdf",
    system_prompt,
    user_prompt,
  });

  let res: Response;
  try {
    res = await fetch(`${PROXY_BASE}/import/analiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      signal: AbortSignal.timeout(20 * 60 * 1000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `PDF analiz servisi ulaşılamadı (${PROXY_BASE}): ${msg}`,
    );
  }

  const text = await res.text();
  let parsed: {
    success?: boolean;
    data?: unknown;
    error?: string;
    raw?: string;
  };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new Error(`PDF analiz yanıtı okunamadı: ${text.slice(0, 300)}`);
  }

  if (!res.ok || parsed.success === false) {
    const hint =
      parsed.error ||
      (parsed.raw ? `Claude yanıtı: ${parsed.raw.slice(0, 200)}` : null) ||
      `HTTP ${res.status}`;
    throw new Error(hint);
  }

  const items = parseProxyItems(parsed.data);
  if (!items.length) {
    throw new Error(
      "PDF'den ekipman kalemi çıkarılamadı — liste okunabilir mi kontrol edin.",
    );
  }

  return items;
}
