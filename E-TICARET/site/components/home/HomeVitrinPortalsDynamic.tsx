"use client";

import dynamic from "next/dynamic";

/** Portal mount — yalnız istemci (ssr:false Server Component'te kullanılamaz). */
export const HomeVitrinPortalsDynamic = dynamic(
  () => import("@/components/home/HomeVitrinPortals").then((m) => m.HomeVitrinPortals),
  { ssr: false },
);
