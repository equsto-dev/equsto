import { NextResponse } from "next/server";
import { readJsonFile } from "@/lib/legacy-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await readJsonFile<any>("pfos-taxonomy.json");
    if (!data) {
      return NextResponse.json({ error: "Taxonomy file not found" }, { status: 404 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
