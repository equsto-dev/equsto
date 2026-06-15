import type { GeoLandingTableData } from "@/lib/geo/geo-landing-table";

type Props = {
  table: GeoLandingTableData;
  lang: "tr" | "en";
};

const UI = {
  tr: {
    h2: "Referans proforma ekipman listesi",
    meta: (no: string) => `Proforma ${no}`,
    download: "Excel dosyasını indir",
  },
  en: {
    h2: "Reference proforma equipment list",
    meta: (no: string) => `Proforma ${no}`,
    download: "Download Excel file",
  },
} as const;

function zoneHeading(zone: string): string {
  return zone.toLocaleLowerCase("tr-TR");
}

export default function GeoLandingEquipmentTable({ table, lang }: Props) {
  const u = UI[lang];
  const xlsxHref = `/data/geo/${table.kaynakDosya}`;
  const zones = table.zones.filter((z) => z.zone !== "Ek kalemler");

  return (
    <section className="eq-geo-proforma" aria-label={u.h2}>
      <h2>{u.h2}</h2>
      <p className="eq-geo-proforma-meta">
        {u.meta(table.proformaNo)}{" "}
        <a href={xlsxHref} download className="eq-geo-proforma-dl">
          {u.download}
        </a>
      </p>
      <div className="eq-geo-proforma-zones">
        {zones.map((zone) => (
          <section key={zone.zone} className="eq-geo-proforma-zone">
            <h3>{zoneHeading(zone.zone)}</h3>
            <ul className="eq-geo-proforma-items">
              {zone.items.map((item, idx) => (
                <li key={`${zone.zone}-${idx}-${item.ad}`}>{item.ad}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
