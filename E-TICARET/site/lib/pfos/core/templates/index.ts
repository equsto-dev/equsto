/**
 * PFOS Template Registry
 */

import type { ConceptTemplate } from "../engine-types";
import { buildAllDayDiningTemplate } from "../../referans/all-day-dining";
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
import { buildSushiTemplate } from "../../referans/sushi";
import { buildSarkuteriKioskTemplate } from "../../referans/sarkuteri-kiosk";
import { buildHamburgerKioskTemplate } from "../../referans/hamburger-kiosk";
import { buildHotdogKioskTemplate } from "../../referans/hotdog-kiosk";
import { buildTavukcuTemplate } from "../../referans/tavukcu";
import { buildRestoranTemplate } from "../../referans/restoran";
import { buildKokteylKahveTemplate } from "../../referans/kokteyl-kahve";

const DYNAMIC_KONSEPT = new Set<Konsept>([
  "steakhouse",
  "balikci",
  "coffee-shop",
  "italyan",
  "birahane",
  "pastane",
  "pizzaci",
  "pideci",
  "sushi",
  "sarkuteri-kiosk",
  "hamburger-kiosk",
  "hotdog-kiosk",
  "tavukcu",
  "all-day-dining-cafe",
  "restoran",
  "kokteyl-kahve",
]);

export const TEMPLATES: Record<
  Exclude<
    Konsept,
    "steakhouse" | "balikci" | "coffee-shop" | "italyan" | "birahane" | "pastane" | "pizzaci" | "pideci" | "sushi" | "sarkuteri-kiosk" | "hamburger-kiosk" | "hotdog-kiosk" | "tavukcu" | "all-day-dining-cafe" | "restoran" | "kokteyl-kahve"
  >,
  ConceptTemplate
> = {
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
      "steakhouse" | "balikci" | "coffee-shop" | "italyan" | "birahane" | "pastane" | "pizzaci" | "pideci" | "sushi" | "sarkuteri-kiosk" | "hamburger-kiosk" | "hotdog-kiosk" | "tavukcu" | "all-day-dining-cafe" | "restoran" | "kokteyl-kahve"
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
  if (konsept === "sushi") return buildSushiTemplate(m2);
  if (konsept === "sarkuteri-kiosk") return buildSarkuteriKioskTemplate(m2);
  if (konsept === "hamburger-kiosk") return buildHamburgerKioskTemplate(m2);
  if (konsept === "hotdog-kiosk") return buildHotdogKioskTemplate(m2);
  if (konsept === "tavukcu") return buildTavukcuTemplate(m2);
  if (konsept === "all-day-dining-cafe") return buildAllDayDiningTemplate(m2);
  if (konsept === "restoran") return buildRestoranTemplate(m2);
  if (konsept === "kokteyl-kahve") return buildKokteylKahveTemplate(m2);
  return getTemplate(konsept);
}

export function getAllTemplates(): ConceptTemplate[] {
  return Object.values(TEMPLATES);
}

export function isDynamicKonsept(konsept: string): boolean {
  return DYNAMIC_KONSEPT.has(konsept as Konsept);
}
