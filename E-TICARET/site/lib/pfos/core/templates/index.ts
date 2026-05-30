/**
 * PFOS Template Registry
 */

import type { ConceptTemplate } from "../engine-types";
import { allDayDiningCafe } from "../rules/all-day-dining-cafe/template";
import { kebapOrtadogu } from "../rules/kebap-ortadogu/template";
import { meyhane } from "../rules/meyhane/template";
import { turkRestoran } from "../rules/turk-restoran/template";
import type { Konsept } from "../../schemas/pfos.schema";
import { buildBalikciTemplate } from "../../referans/balikci";
import { buildCoffeeShopTemplate } from "../../referans/coffee-shop";
import { buildSteakhouseTemplate } from "../../referans/steakhouse";
import { buildItalyanTemplate } from "../../referans/italyan";
import { buildBirahaneTemplate } from "../../referans/birahane";
import { buildPastaneTemplate } from "../../referans/pastane";
import { buildPizzaciReferansTemplate } from "../../referans/pizzaci";
import { buildPideciTemplate } from "../../referans/pideci";

const DYNAMIC_KONSEPT = new Set<Konsept>([
  "steakhouse",
  "balikci",
  "coffee-shop",
  "italyan",
  "birahane",
  "pastane",
  "pizzaci",
  "pideci",
]);

export const TEMPLATES: Record<
  Exclude<
    Konsept,
    "steakhouse" | "balikci" | "coffee-shop" | "italyan" | "birahane" | "pastane" | "pizzaci" | "pideci"
  >,
  ConceptTemplate
> = {
  "all-day-dining-cafe": allDayDiningCafe,
  "kebap-ortadogu": kebapOrtadogu,
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
    konsept as Exclude<
      Konsept,
      "steakhouse" | "balikci" | "coffee-shop" | "italyan" | "birahane" | "pastane" | "pizzaci" | "pideci"
    >
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
  if (konsept === "italyan") return buildItalyanTemplate(m2);
  if (konsept === "birahane") return buildBirahaneTemplate(m2);
  if (konsept === "pastane") return buildPastaneTemplate(m2);
  if (konsept === "pizzaci") return buildPizzaciReferansTemplate(m2);
  if (konsept === "pideci") return buildPideciTemplate(m2);
  return getTemplate(konsept);
}

export function getAllTemplates(): ConceptTemplate[] {
  return Object.values(TEMPLATES);
}

export function isDynamicKonsept(konsept: string): boolean {
  return DYNAMIC_KONSEPT.has(konsept as Konsept);
}
