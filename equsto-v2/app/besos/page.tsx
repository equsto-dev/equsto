import BesosCatalog from "@/components/besos/BesosCatalog";
import BesosEqustoChrome from "@/components/besos/BesosEqustoChrome";
import BesosImt300Hero from "@/components/besos/BesosImt300Hero";
import BesosMethod from "@/components/besos/BesosMethod";
import BesosModular from "@/components/besos/BesosModular";
import BesosProjects from "@/components/besos/BesosProjects";
import BesosServeYou from "@/components/besos/BesosServeYou";
import BesosSignatureBars from "@/components/besos/BesosSignatureBars";
import BesosVitrumVideo from "@/components/besos/BesosVitrumVideo";
import { BESOS_STUDIO } from "@/lib/besos/branding";
import { loadBesosPageData } from "@/lib/besos/load-data";
import type { BesosServeYou as ServeYouData } from "@/lib/besos/types";

const DEFAULT_SERVE: ServeYouData = {
  kicker: `${BESOS_STUDIO} lounge`,
  title: "Size hizmet etmek için tasarlanmış bir sistem",
  body: "İmza sistemlerimiz kuruluma hazırdır; sonsuz özelleştirilebilir modüler tasarım sayesinde ölçek, stil ve operasyon ihtiyaçlarınıza uygun çözüm üretiriz.",
  ctaCatalog: "Bar ürün kataloğunu incele",
  ctaCatalogHref: "#bd-stations",
  ctaInfo: "Daha fazla bilgi istiyorum",
  ctaInfoHref: "/contact",
  image: "images/catalog/besos/web/besos-bes-p23.avif",
};

export default async function BesosPage() {
  const { landing, catalogue, projects, heroVideo } = await loadBesosPageData();
  const products = catalogue.products ?? [];
  const serve = landing.serveYou ?? DEFAULT_SERVE;

  return (
    <>
      <BesosEqustoChrome />
      <main className="besos-page">
        <BesosImt300Hero />
        <div className="bd-vitrum-landing">
          <BesosMethod steps={landing.method} />
        </div>
        <BesosVitrumVideo video={heroVideo} hero={landing.hero} stats={landing.stats} />
        <BesosSignatureBars items={landing.signatureTrio} products={products} />
        <BesosModular modular={landing.modular} products={products} />
        <BesosServeYou serve={serve} />
        <BesosCatalog products={products} />
        <BesosProjects projectsData={projects} products={products} />
      </main>
      <footer className="footer" id="eq-shop-footer" />
    </>
  );
}
