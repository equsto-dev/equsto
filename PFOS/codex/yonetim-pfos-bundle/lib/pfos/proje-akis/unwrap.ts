import type { ProjeAkisData } from "@/lib/pro-admin-client";

const EMPTY: ProjeAkisData = {
  questions: [],
  shopTypes: [],
  rules: [],
  eqSets: [],
  products: [],
};

export function unwrapProjeAkisPayload(raw: unknown): ProjeAkisData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.success === true && o.data && typeof o.data === "object") {
    return { ...EMPTY, ...(o.data as ProjeAkisData) };
  }
  if ("questions" in o || "shopTypes" in o || "products" in o) {
    return { ...EMPTY, ...(o as ProjeAkisData) };
  }
  return null;
}

export function isProjeAkisEmpty(data: ProjeAkisData): boolean {
  return (
    (data.questions?.length ?? 0) === 0 &&
    (data.shopTypes?.length ?? 0) === 0 &&
    (data.products?.length ?? 0) === 0 &&
    (data.rules?.length ?? 0) === 0 &&
    (data.eqSets?.length ?? 0) === 0
  );
}
