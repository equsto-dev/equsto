/** Güvenli fetch JSON parse — boş gövde ve HTML hata sayfalarında anlamlı mesaj */
export async function readFetchJson<T>(
  res: Response,
  emptyMessage: string,
  invalidMessage: string,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(emptyMessage);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(invalidMessage);
  }
}

export async function readFetchJsonOrError<T>(
  res: Response,
  emptyMessage: string,
  invalidMessage: string,
  fallbackMessage: string,
): Promise<T> {
  const data = await readFetchJson<T>(res, emptyMessage, invalidMessage);
  if (!res.ok) {
    const err = (data as { error?: string } | null)?.error;
    throw new Error(
      typeof err === "string" && err.trim()
        ? err.trim()
        : fallbackMessage,
    );
  }
  return data;
}
