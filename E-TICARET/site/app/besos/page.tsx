import BesosCatalog from "@/components/besos/BesosCatalog";
import ShopFooterHost from "@/components/shop/ShopFooterHost";
import BesosImt300Hero from "@/components/besos/BesosImt300Hero";
import BesosMethod from "@/components/besos/BesosMethod";
import BesosModular from "@/components/besos/BesosModular";
import BesosProjects from "@/components/besos/BesosProjects";
import BesosServeYou from "@/components/besos/BesosServeYou";
import BesosSignatureBars from "@/components/besos/BesosSignatureBars";
import BesosVitrumVideo from "@/components/besos/BesosVitrumVideo";
import { BESOS_STUDIO } from "@/lib/besos/branding";
import type { BesosLocale } from "@/lib/besos/locale";
import { localizeProducts } from "@/lib/besos/locale";
import { loadBesosPageData } from "@/lib/besos/load-data";
import type { BesosServeYou as ServeYouData } from "@/lib/besos/types";

const DEFAULT_SERVE_TR: ServeYouData = {
  kicker: `${BESOS_STUDIO} lounge`,
  title: "Size hizmet etmek için tasarlanmış bir sistem",
  body: "İmza sistemlerimiz kuruluma hazırdır; sonsuz özelleştirilebilir modüler tasarım sayesinde ölçek, stil ve operasyon ihtiyaçlarınıza uygun çözüm üretiriz.",
  ctaCatalog: "Bar ürün kataloğunu incele",
  ctaCatalogHref: "#bd-stations",
  ctaInfo: "Daha fazla bilgi istiyorum",
  ctaInfoHref: "/iletisim",
  image: "images/catalog/besos/web/besos-bes-p23.avif",
};

const DEFAULT_SERVE_EN: ServeYouData = {
  kicker: `${BESOS_STUDIO} lounge`,
  title: "A system designed to serve you",
  body: "Our signature systems are ready to install; endlessly customisable modular design lets us craft a solution for your scale, style and operational needs.",
  ctaCatalog: "Browse bar product catalogue",
  ctaCatalogHref: "#bd-stations",
  ctaInfo: "I'd like more information",
  ctaInfoHref: "/en/iletisim",
  image: "images/catalog/besos/web/besos-bes-p23.avif",
};

type Props = {
  locale?: BesosLocale;
};

export async function BesosPageContent({ locale = "tr" }: Props) {
  const { landing, catalogue, heroVideo } = await loadBesosPageData();
  const products = localizeProducts(catalogue.products ?? [], locale);

  return (
    <>
      <main className="besos-page">
        <BesosImt300Hero />
        <div className="bd-vitrum-landing">
          <BesosMethod steps={landing.method} locale={locale} />
        </div>
        <BesosVitrumVideo video={heroVideo} hero={landing.hero} stats={landing.stats} locale={locale} />
        <BesosSignatureBars items={landing.signatureTrio} products={products} locale={locale} />
      </main>
      <ShopFooterHost />
    </>
  );
}

export async function BesosBarIstasyonlariContent({ locale = "tr" }: Props) {
  const { landing, catalogue, projects } = await loadBesosPageData();
  const products = localizeProducts(catalogue.products ?? [], locale);
  const serve = landing.serveYou ?? (locale === "en" ? DEFAULT_SERVE_EN : DEFAULT_SERVE_TR);

  return (
    <>
      <main className="besos-page">
        <BesosModular modular={landing.modular} products={products} locale={locale} />
        <BesosServeYou serve={serve} locale={locale} />
        <BesosCatalog products={products} locale={locale} />
        <BesosProjects projectsData={projects} products={products} locale={locale} />
      </main>
      <ShopFooterHost />
    </>
  );
}

export default async function BesosPage() {
  return <BesosPageContent locale="tr" />;
}
