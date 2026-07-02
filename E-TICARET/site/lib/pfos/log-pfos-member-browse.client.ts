"use client";

import { ensureMemberToken } from "@/lib/account/member-profile.client";
import { memberLoggedInNow } from "@/lib/pfos/member-session.client";
import { readPfosBrowseContext } from "@/lib/pfos/pfos-context.client";

export type PfosMemberBrowseClientInput = {
  slug: string;
  productId?: string | null;
  tipKodu?: string | null;
  source?: "pdp" | "pfos_rail" | "search";
  konseptLabel?: string;
  dukkanTuru?: string;
};

function postBrowse(payload: Record<string, unknown>) {
  void ensureMemberToken().then((token) => {
    if (!token) return;
    void fetch("/api/pfos/member-browse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Equsto-Authorization": token,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* sessiz */
    });
  });
}

/** Üye oturumunda ürün sayfası / PFOS rail tıklaması kaydı (Faz C) */
export function logPfosMemberBrowse(input: PfosMemberBrowseClientInput): void {
  if (typeof window === "undefined") return;
  if (!memberLoggedInNow()) return;

  const slug = String(input.slug ?? "").trim().replace(/^\/urun\//, "");
  if (!slug) return;

  const ctx = readPfosBrowseContext();
  postBrowse({
    slug,
    productId: input.productId ?? null,
    tipKodu: input.tipKodu ?? null,
    source: input.source ?? "pdp",
    konseptLabel: input.konseptLabel ?? ctx.konseptLabel ?? "",
    dukkanTuru: input.dukkanTuru ?? ctx.dukkanTuru ?? "",
  });
}
