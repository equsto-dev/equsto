/**
 * All Day Dining Cafe — resolveTemplateForQuote ile m² bandına göre yüklenir.
 */

import type { ConceptTemplate } from "../../engine-types";

export const allDayDiningCafe: ConceptTemplate = {
  konsept: "all-day-dining-cafe",
  label: "All Day Dining Cafe",
  ornekler: ["The House Café", "Big Chefs"],
  segmentBasis: "m2",
  seatDensity: 1.5,
  teklifPozModu: "referans",
  items: [],
};
