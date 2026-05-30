import type {
  BesosHero,
  BesosMethodStep,
  BesosModular,
  BesosProduct,
  BesosProject,
  BesosServeYou,
  BesosSignatureItem,
  BesosStat,
} from "./types";

export type BesosLocale = "tr" | "en";

export function isBesosEnglish(locale: BesosLocale): boolean {
  return locale === "en";
}

export function pickField(
  locale: BesosLocale,
  tr: string | undefined,
  en?: string | undefined,
): string {
  if (locale === "en" && en) return en;
  return tr ?? en ?? "";
}

export function localizeMethodStep(step: BesosMethodStep, locale: BesosLocale) {
  return {
    n: step.n,
    title: pickField(locale, step.title, step.titleEn),
    text: pickField(locale, step.text, step.textEn),
  };
}

export function localizeHero(hero: BesosHero, locale: BesosLocale) {
  return {
    ...hero,
    title: pickField(locale, hero.title, hero.titleEn),
    lead: pickField(locale, hero.lead, hero.leadEn),
    ctaProject: hero.ctaProject
      ? pickField(locale, hero.ctaProject, locale === "en" ? "Request a project quote" : undefined)
      : undefined,
  };
}

export function localizeStat(stat: BesosStat, locale: BesosLocale) {
  return {
    value: stat.value,
    label: pickField(locale, stat.label, stat.labelEn),
  };
}

export function localizeModular(modular: BesosModular, locale: BesosLocale) {
  return {
    kicker: modular.kicker,
    title: pickField(locale, modular.title, modular.titleEn),
    body: pickField(locale, modular.body, modular.bodyEn),
  };
}

export function localizeServeYou(serve: BesosServeYou, locale: BesosLocale) {
  return {
    ...serve,
    kicker: pickField(locale, serve.kicker, serve.kickerEn),
    title: pickField(locale, serve.title, serve.titleEn),
    body: pickField(locale, serve.body, serve.bodyEn),
    ctaCatalog: pickField(
      locale,
      serve.ctaCatalog,
      serve.ctaCatalogEn ?? "Browse bar product catalogue",
    ),
    ctaInfo: pickField(locale, serve.ctaInfo, serve.ctaInfoEn ?? "I'd like more information"),
  };
}

export function localizeSignatureItem(item: BesosSignatureItem, locale: BesosLocale) {
  return {
    ...item,
    tagline: pickField(locale, item.tagline, item.taglineEn),
    blurb: pickField(locale, item.blurb, item.blurbEn),
  };
}

export function localizeProduct(product: BesosProduct, locale: BesosLocale): BesosProduct {
  if (locale !== "en") return product;
  return {
    ...product,
    description: pickField(locale, product.description, product.descriptionEn),
  };
}

export function localizeProducts(products: BesosProduct[], locale: BesosLocale): BesosProduct[] {
  if (locale !== "en") return products;
  return products.map((p) => localizeProduct(p, locale));
}

export function localizeProject(project: BesosProject, locale: BesosLocale) {
  return {
    location: pickField(locale, project.locationTr ?? project.location, project.location),
    subtitle: pickField(locale, project.subtitleTr ?? project.subtitle, project.subtitle),
    teaser: pickField(locale, project.teaserTr ?? project.teaser, project.teaser),
    quote: pickField(locale, project.quoteTr ?? project.quote, project.quote),
  };
}

export function localizeModuleCaption(
  captionTr: string | undefined,
  captionEn: string | undefined,
  locale: BesosLocale,
): string | undefined {
  const value = pickField(locale, captionTr, captionEn);
  return value || undefined;
}
