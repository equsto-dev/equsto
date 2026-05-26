/**
 * PFOS Template Registry
 */

import type { ConceptTemplate } from "../engine-types";
import { allDayDiningCafe } from "../rules/all-day-dining-cafe/template";
import { kebapOrtadogu } from "../rules/kebap-ortadogu/template";
import { pizzaci } from "../rules/pizzaci/template";
import { meyhane } from "../rules/meyhane/template";
import { turkRestoran } from "../rules/turk-restoran/template";
import type { Konsept } from "../../schemas/pfos.schema";
import { buildBalikciTemplate } from "../../referans/balikci";
import { buildCoffeeShopTemplate } from "../../referans/coffee-shop";
import { buildSteakhouseTemplate } from "../../referans/steakhouse";

const DYNAMIC_KONSEPT = new Set<Konsept>([
  "steakhouse",
  "balikci",
  "coffee-shop",
]);

export const TEMPLATES: Record<
  Exclude<Konsept, "steakhouse" | "balikci" | "coffee-shop">,
  ConceptTemplate
> = {
  "all-day-dining-cafe": allDayDiningCafe,
  "kebap-ortadogu": kebapOrtadogu,
  pizzaci,
  meyhane,
  "turk-restoran": turkRestoran,
};

export function getTemplate(konsept: Konsept): ConceptTemplate {
  if (DYNAMIC_KONSEPT.has(konsept)) {
    throw new Error(
      `${konsept} şablonu referans listesi ile yüklenir — resolveTemplateForQuote kullanın`,
    );
  }
  const t = TEMPLATES[
    konsept as Exclude<Konsept, "steakhouse" | "balikci" | "coffee-shop">
  ];
  if (!t) throw new Error(`Bilinmeyen konsept: ${konsept}`);
  return t;
}

/** Teklif API — referans JSON ile yüklenen konseptler */
export async function resolveTemplateForQuote(
  konsept: Konsept,
  m2: number,
  altTip?: string | null,
): Promise<ConceptTemplate> {
  if (konsept === "steakhouse") return buildSteakhouseTemplate(m2);
  if (konsept === "balikci") return buildBalikciTemplate(m2, undefined, altTip);
  if (konsept === "coffee-shop") return buildCoffeeShopTemplate(m2);
  return getTemplate(konsept);
}

export function getAllTemplates(): ConceptTemplate[] {
  return Object.values(TEMPLATES);
}

export function isDynamicKonsept(konsept: string): boolean {
  return DYNAMIC_KONSEPT.has(konsept as Konsept);
}
