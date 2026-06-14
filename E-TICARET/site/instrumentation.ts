/** PFOS teklif motoru — ilk istek gecikmesini azaltmak için katalog önbelleği */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { loadLegacyCatalogRows } = await import("@/lib/legacy-catalog");
  void loadLegacyCatalogRows().catch(() => {});
}
