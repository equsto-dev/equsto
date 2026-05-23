/**
 * PFOS Calculator — Faz 1 tek motor (zone-catalog + template + bolumM2)
 */

import type { ConceptTemplate } from "./engine-types";
import type { PFOSRequest, PFOSResponse } from "../schemas/pfos.schema";
import { calculateUnifiedQuote } from "./unified-motor";

export async function calculateQuote(
  req: PFOSRequest,
  template: ConceptTemplate,
): Promise<PFOSResponse> {
  return calculateUnifiedQuote(req, template);
}
