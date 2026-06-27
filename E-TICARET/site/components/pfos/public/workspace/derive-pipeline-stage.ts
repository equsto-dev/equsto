import type { PFOSResponse } from "@/lib/pfos/schemas/pfos.schema";
import type { ListePipelineStage, WizardPipelineStage } from "./pfos-workspace.types";

type ListeUploadSlice = {
  file: File | null;
  loadingKind: "excel" | "pdf" | null;
  sonuc: PFOSResponse | null;
  teklifV14: unknown | null;
};

export function deriveListePipelineStage(
  upload: ListeUploadSlice,
): ListePipelineStage {
  if (upload.teklifV14) return "teklif";
  if (upload.sonuc?.ozet?.toplamFiyat != null && upload.sonuc.ozet.toplamFiyat > 0) {
    return "fiyat";
  }
  if (upload.sonuc) return "kontrol";
  if (upload.loadingKind) return "eslestir";
  return "liste";
}

export function deriveWizardPipelineStage(opts: {
  openPanelId: string;
  finished: boolean;
  loading: boolean;
  hasTeklif: boolean;
}): WizardPipelineStage {
  if (opts.hasTeklif && opts.finished) return "teklif";
  if (opts.loading && opts.finished) return "teklif";
  if (opts.openPanelId === "s5" || opts.openPanelId.startsWith("s6")) {
    return "kapasite";
  }
  if (opts.openPanelId === "s4" || opts.openPanelId === "s3") {
    return "teslimat";
  }
  return "konsept";
}
