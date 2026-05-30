export type BesosStat = {
  value: string;
  label: string;
  labelEn?: string;
};

export type BesosHeroVideo = {
  mp4: string;
  webm: string;
  poster: string;
  source?: string;
};

export type BesosHero = {
  kicker?: string;
  title: string;
  titleEn?: string;
  lead: string;
  leadEn?: string;
  ctaCatalog?: string;
  ctaCatalogHref?: string;
  ctaProject?: string;
  ctaProjectHref?: string;
};

export type BesosSignatureItem = {
  slug: string;
  name: string;
  tagline: string;
  taglineEn?: string;
  blurb: string;
  blurbEn?: string;
  page?: number;
};

export type BesosMethodStep = {
  n: string;
  title: string;
  titleEn?: string;
  text: string;
  textEn?: string;
};

export type BesosModular = {
  kicker: string;
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
};

export type BesosServeYou = {
  kicker: string;
  kickerEn?: string;
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
  ctaCatalog: string;
  ctaCatalogEn?: string;
  ctaCatalogHref: string;
  ctaInfo: string;
  ctaInfoEn?: string;
  ctaInfoHref: string;
  image?: string;
};

export type BesosTestimonial = {
  quote: string;
  quoteEn?: string;
  author: string;
  roleTr?: string;
  roleEn?: string;
};

export type BesosLanding = {
  hero: BesosHero;
  signatureTrio: BesosSignatureItem[];
  modular: BesosModular;
  method: BesosMethodStep[];
  testimonials: BesosTestimonial[];
  stats: BesosStat[];
  serveYou?: BesosServeYou;
};

export type BesosPricing = {
  listeEur?: number;
  iskontoOran?: number;
  netEur?: number;
  kdvOran?: number;
  fiyatEurKdvDahil: number;
  currency?: string;
};

export type BesosProduct = {
  slug?: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  descriptionEn?: string;
  page?: number;
  image?: string;
  imageLocal?: string;
  drawing?: string;
  totalDimensionsMm?: string;
  features?: string[];
  featuresEn?: string[];
  pricing?: BesosPricing;
  fiyatEurKdvDahil?: number;
};

export type BesosCatalogue = {
  publisher?: string;
  products: BesosProduct[];
};

export type BesosFeaturedModule = {
  slug: string;
  captionTr?: string;
  captionEn?: string;
};

export type BesosProject = {
  slug: string;
  name: string;
  location: string;
  locationTr?: string;
  year?: string;
  subtitle?: string;
  subtitleTr?: string;
  teaser?: string;
  teaserTr?: string;
  quote?: string;
  quoteTr?: string;
  url?: string;
  image?: string;
  featuredModules?: BesosFeaturedModule[];
};

export type BesosInterludeGroup = {
  categoryKey: string;
  labelTr: string;
  labelEn?: string;
};

export type BesosProjectsData = {
  projects: BesosProject[];
  interludeGroups?: BesosInterludeGroup[];
};

export type BesosCategoryGroup = {
  key: string;
  slug: string;
  label: string;
  blurb: string;
  items: BesosProduct[];
};
