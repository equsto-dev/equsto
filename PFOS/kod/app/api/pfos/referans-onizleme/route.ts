import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  findShopTypeForQuote,
  loadProjeAkisShopTypes,
} from "@/lib/pfos/proje-akis/load-shop-types";
import { resolveReferansBaglam } from "@/lib/pfos/proje-akis/shop-type-referans";

export const runtime = "nodejs";

/** POST — dükkan türü + m² → proje-akis shopTypes bandı + kayıtlı referans dosyası */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      dukkanSecim?: string;
      m2?: number;
      altTip?: string;
    };
    const dukkanSecim = String(body.dukkanSecim ?? "").trim();
    const m2 = Number(body.m2);
    if (!dukkanSecim) {
      return NextResponse.json(
        { error: "dukkanSecim gerekli" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(m2) || m2 < 8) {
      return NextResponse.json({ error: "Geçerli m² gerekli" }, { status: 400 });
    }

    const shopTypes = await loadProjeAkisShopTypes();
    const shopType = findShopTypeForQuote(
      shopTypes,
      dukkanSecim,
      undefined,
      body.altTip ?? null,
    );
    if (!shopType) {
      return NextResponse.json(
        { error: "Dükkan türü shopTypes içinde bulunamadı", dukkanSecim },
        { status: 404 },
      );
    }

    const baglam = await resolveReferansBaglam(
      shopType,
      m2,
      body.altTip ?? null,
    );
    if (!baglam) {
      return NextResponse.json(
        {
          error: "Referans listesi yok veya planlanmış konsept",
          shopType: {
            id: shopType.id,
            name: shopType.name,
            teklifKaynagi: shopType.pfos.teklifKaynagi,
            bantKurali: shopType.pfos.bantKurali,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: baglam });
  } catch (e) {
    console.error("[pfos referans-onizleme]", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
