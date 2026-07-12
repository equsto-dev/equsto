import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { BlogDraft } from "@/lib/blog-agent/types";

const ROOT = process.cwd();
const GEO_LANDINGS = path.join(ROOT, "public/data/geo-landings.json");
const LIB_LANDINGS = path.join(ROOT, "lib/geo/landings.json");
const DRAFTS_DIR = path.join(ROOT, "scripts/data/blog-agent/drafts");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function readBlogDraft(slug: string): BlogDraft | null {
  const file = path.join(DRAFTS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return readJson<BlogDraft>(file);
  } catch {
    return null;
  }
}

export async function publishBlogDraft(slug: string): Promise<{
  ok: boolean;
  key?: string;
  error?: string;
}> {
  const draft = readBlogDraft(slug);
  if (!draft) return { ok: false, error: "Taslak bulunamadı" };
  if (draft.status === "published") {
    return { ok: true, key: draft.geoKey };
  }

  if (!fs.existsSync(GEO_LANDINGS)) {
    return { ok: false, error: "geo-landings.json bulunamadı" };
  }

  const landings = readJson<Record<string, unknown>>(GEO_LANDINGS);
  const key = draft.geoKey || `rehber/${draft.slug}`;

  landings[key] = {
    profile: draft.profile || "rehberBlog",
    title: draft.title,
    description: draft.description,
    h1: draft.h1,
    lead: draft.lead || "",
    skipBudget: true,
    skipTable: true,
    body: draft.body,
  };

  const blogHub = landings.blog as
    | { sections?: Array<{ title?: string; links?: Array<{ label: string; href: string }> }> }
    | undefined;

  if (blogHub?.sections) {
    const editorial = blogHub.sections.find((s) =>
      String(s.title || "").includes("Editoryal"),
    );
    if (editorial) {
      const href = `/rehber/${draft.slug}`;
      const exists = (editorial.links || []).some((l) => l.href === href);
      if (!exists) {
        editorial.links = editorial.links || [];
        editorial.links.unshift({
          label: draft.h1 || draft.title.replace(/\s*\|\s*Equsto\s*$/i, ""),
          href,
        });
      }
    }
  }

  writeJson(GEO_LANDINGS, landings);

  if (fs.existsSync(path.dirname(LIB_LANDINGS))) {
    await fsp.copyFile(GEO_LANDINGS, LIB_LANDINGS);
  }

  draft.status = "published";
  draft.publishedAt = new Date().toISOString();
  writeJson(path.join(DRAFTS_DIR, `${draft.slug}.json`), draft);

  const stateFile = path.join(ROOT, "scripts/data/blog-agent/state.json");
  const state = fs.existsSync(stateFile)
    ? readJson<Record<string, string[]>>(stateFile)
    : {};
  state.publishedTopicIds = [...new Set([...(state.publishedTopicIds || []), draft.topicId])];
  writeJson(stateFile, state);

  return { ok: true, key };
}
