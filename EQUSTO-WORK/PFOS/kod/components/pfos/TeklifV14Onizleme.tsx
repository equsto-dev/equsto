"use client";

import type { TeklifModelV14 } from "@/lib/pfos/teklif/teklif-v14.types";
import TeklifV14Proforma from "@/components/pfos/TeklifV14Proforma";

type Props = {
  model: TeklifModelV14;
};

/** @deprecated TeklifV14Proforma kullanın */
export default function TeklifV14Onizleme({ model }: Props) {
  return <TeklifV14Proforma model={model} />;
}
