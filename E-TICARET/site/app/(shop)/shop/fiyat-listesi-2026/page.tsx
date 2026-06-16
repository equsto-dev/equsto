import type { Metadata } from "next";
import Link from "next/link";
import { readJsonFile, dataRel } from "@/lib/legacy-data";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopStyles from "@/components/shop/ShopStyles";

export const dynamic = "force-dynamic";

type IndexSheet = {
  kod: string;
  urun_adi: string;
  dept: string;
  pfos_count: number;
  eticaret_count: number;
  slug: string;
};

export const metadata: Metadata = {
  title: "EQUSTO Fiyat Listesi 2026 · Equsto",
  description: "EQUSTO paslanmaz mutfak fiyat listesi — AISI 304 kalite, tüm seriler.",
  robots: { index: false, follow: false },
};

export default async function EqustoFiyatListesiHubPage() {
  const index = await readJsonFile<{
    sheet_count: number;
    pfos_count: number;
    eticaret_count: number;
    malzeme: string;
    sheets: IndexSheet[];
  }>(dataRel("fiyat-listeleri", "equsto", "2026-fiyat-listesi", "index.json"));

  if (!index?.sheets?.length) {
    return (
      <p style={{ padding: 24 }}>
        Katalog henüz üretilmedi. <code>npm run catalog:equsto:fiyat-listesi</code>
      </p>
    );
  }

  const byDept = index.sheets.reduce<Record<string, IndexSheet[]>>((acc, s) => {
    (acc[s.dept] ||= []).push(s);
    return acc;
  }, {});

  const deptLabel: Record<string, string> = {
    tezgah: "Tezgahlar",
    davlumbaz: "Davlumbazlar",
    dolap: "Dolaplar",
    istif: "Raflar",
  };

  return (
    <>
      <ShopStyles variant="plp" />
      <ShopBodyClass className="eq-shop eq-dept eq-dept-plp" />
      <ShopEqustoChrome activeDept={null} />
      <div className="pg" style={{ padding: "20px 24px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <h1 className="eq-dept-plp-title">EQUSTO Fiyat Listesi 2026</h1>
        <p className="eq-dept-plp-lead">
          {index.malzeme}. Marka: Equsto. {index.eticaret_count} e-ticaret ürünü,{" "}
          {index.pfos_count} PFOS ölçüsü.
        </p>
        {Object.entries(byDept).map(([dept, sheets]) => (
          <section key={dept} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 16, marginBottom: 10 }}>{deptLabel[dept] || dept}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {sheets.map((s) => (
                <li key={s.kod}>
                  <Link
                    href={`/shop/${dept}/seri/${s.slug}`}
                    style={{ color: "var(--eq-accent, #c9a227)", textDecoration: "none" }}
                  >
                    <strong>{s.kod}</strong> — {s.urun_adi}
                  </Link>
                  <span style={{ color: "var(--eq-text-muted)", fontSize: 12, marginLeft: 8 }}>
                    {s.eticaret_count > 0
                      ? `${s.eticaret_count} vitrin`
                      : "PFOS"}
                    {" / "}
                    {s.pfos_count} ölçü
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
