const DEFAULT_MODEL = "gemini-embedding-2";
const DEFAULT_DIM = 768;

export type GeminiImageEmbedding = {
  values: number[];
  model: string;
  dimensions: number;
};

function resolveModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_MODEL;
}

function resolveDimensions(): number {
  const raw = Number(process.env.VISUAL_EMBEDDING_DIM || DEFAULT_DIM);
  if (!Number.isFinite(raw) || raw < 128 || raw > 3072) return DEFAULT_DIM;
  return Math.round(raw);
}

function parseEmbeddingResponse(data: unknown): number[] {
  const d = data as {
    embedding?: { values?: number[] };
    embeddings?: Array<{ values?: number[] }>;
  };
  const fromSingle = d.embedding?.values;
  if (Array.isArray(fromSingle) && fromSingle.length) return fromSingle;
  const fromList = d.embeddings?.[0]?.values;
  if (Array.isArray(fromList) && fromList.length) return fromList;
  throw new Error("Gemini embedding yanıtında vektör bulunamadı.");
}

/** Görsel → 768 boyutlu embedding (gemini-embedding-2). */
export async function embedImageBuffer(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<GeminiImageEmbedding> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY yok");

  const model = resolveModel();
  const dimensions = resolveDimensions();
  const mime = (mimeType || "image/jpeg").toLowerCase();
  const base64 = Buffer.from(buffer).toString("base64");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: `models/${model}`,
      content: {
        parts: [{ inline_data: { mime_type: mime, data: base64 } }],
      },
      outputDimensionality: dimensions,
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini embedding HTTP ${res.status}: ${bodyText.slice(0, 240)}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch {
    throw new Error("Gemini embedding yanıtı okunamadı.");
  }

  const values = parseEmbeddingResponse(data);
  return { values, model, dimensions: values.length };
}

/** CDN / public URL'den görsel indirip embed et. */
export async function embedImageFromUrl(imageUrl: string): Promise<GeminiImageEmbedding> {
  const url = String(imageUrl || "").trim();
  if (!url) throw new Error("Görsel URL boş");

  const res = await fetch(url, {
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`Görsel indirilemedi HTTP ${res.status}: ${url.slice(0, 120)}`);
  }

  const mime = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength < 200) throw new Error("Görsel çok küçük veya boş");
  if (buffer.byteLength > 8 * 1024 * 1024) {
    throw new Error("Görsel 8 MB üzeri — indeks atlandı");
  }

  return embedImageBuffer(buffer, mime);
}

/** pgvector için `[v1,v2,...]` formatı. */
export function embeddingToPgVector(values: number[]): string {
  return `[${values.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}
