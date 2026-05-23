/**
 * PFOS Template Registry
 */

import type { ConceptTemplate } from "../engine-types";
import { allDayDiningCafe } from "../rules/all-day-dining-cafe/template";
import { kebapOrtadogu } from "../rules/kebap-ortadogu/template";
import { pizzaci } from "../rules/pizzaci/template";
import { meyhane } from "../rules/meyhane/template";
import { turkRestoran } from "../rules/turk-restoran/template";
import { coffeeShop } from "../rules/coffee-shop/template";
import type { Konsept } from "../../schemas/pfos.schema";

export const TEMPLATES: Record<Konsept, ConceptTemplate> = {
  "all-day-dining-cafe": allDayDiningCafe,
  "kebap-ortadogu": kebapOrtadogu,
  pizzaci,
  meyhane,
  "turk-restoran": turkRestoran,
  "coffee-shop": coffeeShop,
};

export function getTemplate(konsept: Konsept): ConceptTemplate {
  const t = TEMPLATES[konsept];
  if (!t) throw new Error(`Bilinmeyen konsept: ${konsept}`);
  return t;
}

export function getAllTemplates(): ConceptTemplate[] {
  return Object.values(TEMPLATES);
}
