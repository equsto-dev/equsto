export type BesosUrbanBarGroupDef = {
  key: string;
  labelTr: string;
  labelEn: string;
  tags: string[];
};

export type BesosUrbanBarSectionDef = {
  key: string;
  slug: string;
  labelTr: string;
  labelEn: string;
  blurbTr: string;
  blurbEn: string;
  groups: BesosUrbanBarGroupDef[];
};

export type BesosUrbanBarTaxonomy = {
  brand: string;
  brandSlug: string;
  sections: BesosUrbanBarSectionDef[];
  excludeFromBesos: {
    tags: string[];
    collectionHandles: string[];
  };
};

export type BesosUrbanBarProduct = {
  id: string;
  equstoId: string;
  handle: string;
  code: string;
  name: string;
  section: string;
  group: string;
  sectionLabelTr: string;
  sectionLabelEn: string;
  groupLabelTr: string;
  groupLabelEn: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  price?: string;
  fiyat_tl?: number;
  priceGbp?: number;
  vendor?: string;
  catTags?: string[];
  collections?: string[];
  shopHref: string;
  besosHref?: string;
  sourceUrl?: string;
};

export type BesosUrbanBarGroup = {
  key: string;
  slug: string;
  label: string;
  items: BesosUrbanBarProduct[];
};

export type BesosUrbanBarSectionCatalog = {
  key: string;
  slug: string;
  label: string;
  blurb: string;
  productCount: number;
  groups: BesosUrbanBarGroup[];
};

export type BesosUrbanBarCatalog = {
  brand: string;
  brandSlug: string;
  builtAt: string;
  productCount: number;
  sections: BesosUrbanBarSectionCatalog[];
  products: BesosUrbanBarProduct[];
};
