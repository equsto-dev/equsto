import { NextRequest, NextResponse } from "next/server";
import { loadPfosProjects } from "@/lib/pfos/projects/load-projects";

export const runtime = "nodejs";

/** GET /api/pfos/projects — arşiv + referans mutfak projeleri */
export async function GET(req: NextRequest) {
  try {
    const bundle = await loadPfosProjects();
    const sp = req.nextUrl.searchParams;
    const yil = sp.get("yil")?.trim();
    const konsept = sp.get("konsept")?.trim();
    const dukkan = sp.get("dukkan")?.trim();
    const zone = sp.get("zone")?.trim();
    const referansOnly = sp.get("referans") === "1";
    const q = sp.get("q")?.trim().toLowerCase();

    let projects = bundle.projects;
    if (yil) projects = projects.filter((p) => p.yil === yil);
    if (konsept) projects = projects.filter((p) => p.konsept === konsept);
    if (dukkan) projects = projects.filter((p) => p.dukkan === dukkan);
    if (zone) projects = projects.filter((p) => p.zones.includes(zone));
    if (referansOnly) projects = projects.filter((p) => p.referans);
    if (q) {
      projects = projects.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.baslik.toLowerCase().includes(q) ||
          p.folder.toLowerCase().includes(q),
      );
    }

    return NextResponse.json({
      success: true,
      ...bundle,
      projects,
      filtered: projects.length,
    });
  } catch (e) {
    console.error("[PFOS projects]", e);
    return NextResponse.json(
      { error: "Proje listesi yüklenemedi" },
      { status: 500 },
    );
  }
}
