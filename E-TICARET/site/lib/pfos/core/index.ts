export type {
  ConceptTemplate,
  ConceptTemplateItem,
  EvaluatedTemplateItem,
  PfosKategoriKodu,
  TemplateScale,
} from "./engine-types";

export { allDayDiningCafe } from "./rules/all-day-dining-cafe/template";
export { buildCoffeeShopTemplate } from "../referans/coffee-shop";
export { pizzaci } from "./rules/pizzaci/template";
export { turkRestoran } from "./rules/turk-restoran/template";
export { meyhane } from "./rules/meyhane/template";
export { kebapOrtadogu } from "./rules/kebap-ortadogu/template";

export {
  TEMPLATES,
  getTemplate,
  getAllTemplates,
} from "./templates";

import { getAllTemplates } from "./templates";
import type { ConceptTemplate } from "./engine-types";

export const PFOS_CONCEPT_TEMPLATES = getAllTemplates();

export const PFOS_CONCEPT_BY_SLUG: Record<string, ConceptTemplate> =
  Object.fromEntries(PFOS_CONCEPT_TEMPLATES.map((t) => [t.konsept, t]));

export { calcAdet } from "./engine-types";
export type { RuleItem } from "./engine-types";
export { calculateQuote } from "./calculator";
export { calculateUnifiedQuote, resolveBolumM2 } from "./unified-motor";
