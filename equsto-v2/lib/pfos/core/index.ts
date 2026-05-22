export type {
  ConceptTemplate,
  ConceptTemplateItem,
  EvaluatedTemplateItem,
  PfosKategoriKodu,
  TemplateScale,
} from "./engine-types";

export { coffeeShop } from "./rules/coffee-shop/template";
export { pizzaci } from "./rules/pizzaci/template";
export { turkRestoran } from "./rules/turk-restoran/template";
export { meyhane } from "./rules/meyhane/template";
export { kebapOrtadogu } from "./rules/kebap-ortadogu/template";

import { coffeeShop } from "./rules/coffee-shop/template";
import { kebapOrtadogu } from "./rules/kebap-ortadogu/template";
import { meyhane } from "./rules/meyhane/template";
import { pizzaci } from "./rules/pizzaci/template";
import { turkRestoran } from "./rules/turk-restoran/template";
import type { ConceptTemplate } from "./engine-types";

export const PFOS_CONCEPT_TEMPLATES: ConceptTemplate[] = [
  coffeeShop,
  pizzaci,
  turkRestoran,
  meyhane,
  kebapOrtadogu,
];

export const PFOS_CONCEPT_BY_SLUG: Record<string, ConceptTemplate> =
  Object.fromEntries(PFOS_CONCEPT_TEMPLATES.map((t) => [t.konsept, t]));

export { calcAdet } from "./engine-types";
export type { RuleItem } from "./engine-types";
export { calculateQuote } from "./calculator";
