import {
  formatGeoTableEur,
  type GeoLandingTableData,
} from "@/lib/geo/geo-landing-table";

type Props = {
  table: GeoLandingTableData;
  lang: "tr" | "en";
};

const UI = {
  tr: {
    h2: "Referans proforma ekipman tablosu",
    meta: (no: string, count: number) =>
      `Proforma ${no} · ${count} kalem · KDV hariç EUR özet`,
    download: "Excel dosyasını indir",
    thName: "Ekipman",
    thDim: "Ölçü",
    thQty: "Adet",
    thList: "Liste tutar",
    thQuote: "Proforma tutar",
    thZone: "Bölüm",
    total: "Toplam",
  },
  en: {
    h2: "Reference proforma equipment table",
    meta: (no: string, count: number) =>
      `Proforma ${no} · ${count} line items · EUR summary excl. VAT`,
    download: "Download Excel file",
    thName: "Equipment",
    thDim: "Dimensions",
    thQty: "Qty",
    thList: "List total",
    thQuote: "Proforma total",
    thZone: "Zone",
    total: "Total",
  },
} as const;

export default function GeoLandingEquipmentTable({ table, lang }: Props) {
  const u = UI[lang];
  const xlsxHref = `/data/geo/${table.kaynakDosya}`;

  return (
    <section className="eq-geo-table-wrap" aria-label={u.h2}>
      <h2>{u.h2}</h2>
      <p className="eq-geo-table-meta">
        {u.meta(table.proformaNo, table.ozet.kalemSayisi)}{" "}
        <a href={xlsxHref} download className="eq-geo-table-dl">
          {u.download}
        </a>
      </p>
      <div className="eq-geo-table-scroll">
        <table className="eq-geo-table eq-geo-table--proforma">
          <thead>
            <tr>
              <th>{u.thZone}</th>
              <th>{u.thName}</th>
              <th>{u.thDim}</th>
              <th className="eq-geo-num">{u.thQty}</th>
              <th className="eq-geo-num">{u.thList}</th>
              <th className="eq-geo-num">{u.thQuote}</th>
            </tr>
          </thead>
          <tbody>
            {table.zones.map((zone) =>
              zone.items.map((item, idx) => (
                <tr key={`${zone.zone}-${idx}-${item.ad}`}>
                  <td>{idx === 0 ? zone.zone : ""}</td>
                  <td>{item.ad}</td>
                  <td>{item.olcu && item.olcu !== "-" ? item.olcu : "—"}</td>
                  <td className="eq-geo-num">{item.adet}</td>
                  <td className="eq-geo-num">
                    {formatGeoTableEur(item.listeTutarEur, lang)}
                  </td>
                  <td className="eq-geo-num">
                    {formatGeoTableEur(item.satisTutarEur, lang)}
                  </td>
                </tr>
              )),
            )}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={4}>{u.total}</th>
              <th className="eq-geo-num">
                {formatGeoTableEur(table.ozet.listeToplamEur, lang)}
              </th>
              <th className="eq-geo-num">
                {formatGeoTableEur(table.ozet.satisToplamEur, lang)}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
