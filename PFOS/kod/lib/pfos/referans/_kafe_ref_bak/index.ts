import { buildKafeMatrixTemplate } from "../../core/rules/kafe/build-template";
import type { KafeOlcek, KafeYogunluk } from "../../core/matrix/kafe.types";

export type BuildKafeTemplateOptions = {
  olcek?: KafeOlcek;
  yogunluk?: KafeYogunluk;
  preferReferansSeed?: boolean;
  altTip?: string | null;
};

export async function buildKafeTemplate(
  m2: number,
  options: BuildKafeTemplateOptions = {},
) {
  return buildKafeMatrixTemplate(m2, options);
}

export { legacyKonseptToKafe, resolveKafeCell } from "../../core/matrix/kafe-resolver";
