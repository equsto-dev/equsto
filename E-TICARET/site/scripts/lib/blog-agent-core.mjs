/**
 * Blog ajanı — rakip konu analizi, boşluk tespiti, haftalık yazı üretimi
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = path.join(ROOT, "scripts/data/blog-agent");
const DRAFTS_DIR = path.join(DATA_DIR, "drafts");
const COMPETITOR_TOPICS = path.join(DATA_DIR, "competitor-topics.json");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const GEO_LANDINGS = path.join(ROOT, "public/data/geo-landings.json");
const LIB_LANDINGS = path.join(ROOT, "lib/geo/landings.json");

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordOverlap(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return 0;
  if (na.includes(nb) || nb.includes(na)) return 1;
  const aw = new Set(na.split(" ").filter((w) => w.length > 3));
  const bw = nb.split(" ").filter((w) => w.length > 3);
  if (!aw.size || !bw.length) return 0;
  let hit = 0;
  for (const w of bw) if (aw.has(w)) hit++;
  return hit / Math.max(bw.length, 1);
}

/**
 * @returns {{ articles: object[], slugs: string[], titles: string[] }}
 */
export function loadEqustoArticles() {
  const landings = readJson(GEO_LANDINGS);
  const articles = [];
  const slugs = [];
  const titles = [];

  for (const [key, val] of Object.entries(landings)) {
    if (key === "version" || key === "source" || key === "blog") continue;
    if (!val || typeof val !== "object") continue;
    const page = val;
    const title = String(page.title || page.h1 || "");
    const h1 = String(page.h1 || "");
    const slug = key.startsWith("rehber/") ? key.replace(/^rehber\//, "") : key;
    articles.push({ key, slug, title, h1, profile: page.profile || "" });
    slugs.push(slug);
    titles.push(title, h1);
  }

  const blogHub = landings.blog;
  if (blogHub?.sections) {
    for (const sec of blogHub.sections) {
      for (const link of sec.links || []) {
        const href = String(link.href || "");
        const label = String(link.label || "");
        titles.push(label);
        const m = href.match(/\/rehber\/([^/?#]+)/);
        if (m) slugs.push(m[1]);
      }
    }
  }

  return { articles, slugs, titles };
}

/**
 * @returns {import('./blog-agent-types.mjs').CompetitorBlogTopic[]}
 */
export function loadCompetitorTopics() {
  const data = readJson(COMPETITOR_TOPICS);
  return data.topics || [];
}

/**
 * @param {import('./blog-agent-types.mjs').CompetitorBlogTopic[]} competitorTopics
 * @param {ReturnType<typeof loadEqustoArticles>} equsto
 * @returns {import('./blog-agent-types.mjs').TopicGap[]}
 */
export function findTopicGaps(competitorTopics, equsto) {
  const gaps = [];
  const usedTopicIds = new Set();

  const state = fs.existsSync(STATE_FILE) ? readJson(STATE_FILE) : {};
  for (const id of state.draftedTopicIds || []) usedTopicIds.add(id);
  for (const id of state.publishedTopicIds || []) usedTopicIds.add(id);

  for (const topic of competitorTopics) {
    if (usedTopicIds.has(topic.id)) continue;

    const topicText = [topic.title, ...(topic.keywords || [])].join(" ");
    let best = 0;
    for (const t of equsto.titles) {
      best = Math.max(best, keywordOverlap(topicText, t));
    }
    for (const slug of equsto.slugs) {
      best = Math.max(best, keywordOverlap(topic.id, slug));
    }

    if (best >= 0.55) continue;

    gaps.push({
      id: topic.id,
      title: topic.title,
      category: topic.category,
      priority: topic.priority,
      keywords: topic.keywords || [],
      competitorSites: [topic.site],
      rationale:
        best > 0.2
          ? `Kısmi örtüşme (%${Math.round(best * 100)}) — rakiplerde var, Equsto'da derin rehber yok`
          : "Rakip sitelerde yaygın konu — Equsto rehber kapsamında eksik",
      competitorCount: 1,
    });
  }

  gaps.sort((a, b) => {
    const pa = PRIORITY_RANK[a.priority] ?? 9;
    const pb = PRIORITY_RANK[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return b.competitorCount - a.competitorCount;
  });

  return gaps;
}

/**
 * @returns {import('./blog-agent-types.mjs').BlogDraft[]}
 */
export function listDrafts() {
  if (!fs.existsSync(DRAFTS_DIR)) return [];
  const files = fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith(".json"));
  const drafts = [];
  for (const f of files) {
    try {
      drafts.push(readJson(path.join(DRAFTS_DIR, f)));
    } catch {
      /* skip */
    }
  }
  drafts.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return drafts;
}

function slugify(title, year = new Date().getFullYear()) {
  const base = normalizeText(title)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48)
    .replace(/-$/, "");
  return `${base}-${year}`;
}

function resolveModel() {
  const raw = process.env.ANTHROPIC_MODEL?.trim();
  if (!raw || raw.startsWith("claude-3")) return "claude-sonnet-4-6";
  return raw;
}

/**
 * @param {import('./blog-agent-types.mjs').TopicGap} gap
 * @returns {Promise<import('./blog-agent-types.mjs').BlogDraft|null>}
 */
export async function generateDraftWithAi(gap) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const slug = slugify(gap.title);
  const prompt = `Equsto (equsto.com) B2B endüstriyel mutfak platformu için Türkçe SEO rehber yazısı üret.

Konu: ${gap.title}
Kategori: ${gap.category}
Anahtar kelimeler: ${(gap.keywords || []).join(", ")}
Rakip gerekçe: ${gap.rationale}

Kurallar:
- Hedef kitle: restoran, otel, cafe, catering, bulut mutfak yatırımcıları
- Ton: teknik ama anlaşılır B2B
- 600-900 kelime HTML body (<p>, <h2>, <ul>/<ol>, iç linkler)
- En az 2 iç link: /pfos, /mutfak-teklif-platformu veya ilgili konsept rehberi
- PFOS ve teklif CTA'sı doğal yerleştirilsin
- Fiyat veya garanti iddiası uydurma

Yanıtı YALNIZCA JSON ver (markdown yok):
{
  "title": "SEO title | Equsto",
  "description": "meta description 140-160 karakter",
  "h1": "sayfa başlığı",
  "lead": "1 cümle özet",
  "body": "<p>...</p>"
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: resolveModel(),
        max_tokens: 4000,
        system:
          "Sen endüstriyel mutfak SEO editörüsün. Yalnızca geçerli JSON döndür.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n")
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const now = new Date().toISOString();
    const draft = {
      id: `draft-${slug}`,
      slug,
      geoKey: `rehber/${slug}`,
      title: String(parsed.title || `${gap.title} | Equsto`),
      description: String(parsed.description || gap.title),
      h1: String(parsed.h1 || gap.title),
      lead: String(parsed.lead || ""),
      body: String(parsed.body || `<p>${gap.title}</p>`),
      profile: `rehberBlog${gap.category.charAt(0).toUpperCase()}${gap.category.slice(1)}`,
      topicId: gap.id,
      status: "draft",
      createdAt: now,
      source: "anthropic",
    };
    return draft;
  } catch {
    return null;
  }
}

/**
 * @param {import('./blog-agent-types.mjs').TopicGap} gap
 * @returns {import('./blog-agent-types.mjs').BlogDraft}
 */
export function generateDraftFallback(gap) {
  const slug = slugify(gap.title);
  const now = new Date().toISOString();
  const kw = (gap.keywords || []).slice(0, 3).join(", ");
  return {
    id: `draft-${slug}`,
    slug,
    geoKey: `rehber/${slug}`,
    title: `${gap.title} | Equsto`,
    description: `${gap.title}: endüstriyel mutfak planlama, ekipman seçimi ve PFOS teklif rehberi.`,
    h1: gap.title,
    lead: `${gap.category} kategorisinde rakip sitelerin ele aldığı konu — Equsto editoryal rehber taslağı.`,
    body: `<p>${gap.title}, Türkiye'de endüstriyel mutfak yatırımcılarının sık aradığı bir başlıktır. Bu taslak, ${gap.competitorSites?.[0] || "sektör"} bloglarındaki içerik yoğunluğuna göre Equsto rehber boşluğunu kapatmak için üretilmiştir.</p><h2>Planlama özeti</h2><p>Konu kapsamı: ${kw}. Kapasite, menü ve alan girdileri <a href="/pfos">Proje Fabrikası (PFOS)</a> ile modül listesine dönüştürülür; satın alma öncesi satış mühendisliği onayı önerilir.</p><h2>Ekipman ve süreç</h2><p>İlgili departmanlar (pişirme, soğutma, yıkama, hazırlık) konsept rehberleriyle birlikte okunmalıdır. Teklif özeti için <a href="/mutfak-teklif-platformu">mutfak teklif platformu</a> sayfasına bakın.</p><h2>Sonraki adım</h2><p>ANTHROPIC_API_KEY tanımlı ortamda ajan bu taslağı genişletilmiş editoryal metinle güncelleyebilir.</p>`,
    profile: `rehberBlog${gap.category.charAt(0).toUpperCase()}${gap.category.slice(1)}`,
    topicId: gap.id,
    status: "draft",
    createdAt: now,
    source: "template",
  };
}

/**
 * @param {import('./blog-agent-types.mjs').BlogDraft} draft
 */
export function saveDraft(draft) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  const file = path.join(DRAFTS_DIR, `${draft.slug}.json`);
  writeJson(file, draft);
  return file;
}

/**
 * @param {import('./blog-agent-types.mjs').BlogDraft} draft
 */
export async function publishDraft(draft) {
  const landings = readJson(GEO_LANDINGS);
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

  if (landings.blog?.sections) {
    const editorial = landings.blog.sections.find((s) =>
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
  saveDraft(draft);

  const state = fs.existsSync(STATE_FILE) ? readJson(STATE_FILE) : {};
  state.publishedTopicIds = [...new Set([...(state.publishedTopicIds || []), draft.topicId])];
  state.lastPublishedAt = draft.publishedAt;
  writeJson(STATE_FILE, state);

  return { key, path: GEO_LANDINGS };
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.forceDraft]
 * @param {boolean} [opts.skipAi]
 * @param {string} [opts.topicId]
 */
export async function runBlogAgentChecks(opts = {}) {
  const t0 = Date.now();
  const weekKey = isoWeekKey();
  const state = fs.existsSync(STATE_FILE) ? readJson(STATE_FILE) : {};

  const competitorTopics = loadCompetitorTopics();
  const equsto = loadEqustoArticles();
  const gapTopics = findTopicGaps(competitorTopics, equsto);
  const drafts = listDrafts();

  let weeklyDraftCreated = false;
  let latestDraft = drafts[0] || null;

  const shouldCreate =
    opts.forceDraft ||
    state.lastDraftWeek !== weekKey ||
    !drafts.some((d) => d.createdAt && isoWeekKey(new Date(d.createdAt)) === weekKey);

  if (shouldCreate && gapTopics.length) {
    const pick =
      (opts.topicId && gapTopics.find((g) => g.id === opts.topicId)) || gapTopics[0];
    let draft = null;
    if (!opts.skipAi) {
      draft = await generateDraftWithAi(pick);
    }
    if (!draft) draft = generateDraftFallback(pick);
    saveDraft(draft);
    latestDraft = draft;
    weeklyDraftCreated = true;

    state.lastDraftWeek = weekKey;
    state.lastDraftAt = draft.createdAt;
    state.draftedTopicIds = [...new Set([...(state.draftedTopicIds || []), pick.id])];
    writeJson(STATE_FILE, state);
  }

  const pending = drafts.filter((d) => d.status !== "published").length;

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    status: gapTopics.length ? "ok" : "info",
    summary: {
      competitorTopics: competitorTopics.length,
      equstoArticles: equsto.articles.length,
      gapTopics: gapTopics.length,
      draftsTotal: drafts.length + (weeklyDraftCreated ? 1 : 0),
      draftsPending: pending + (weeklyDraftCreated ? 1 : 0),
      currentWeek: weekKey,
      weeklyDraftCreated,
    },
    checks: {
      competitor_seed: {
        status: competitorTopics.length > 0 ? "ok" : "error",
        count: competitorTopics.length,
        sources: readJson(COMPETITOR_TOPICS).sources || [],
      },
      equsto_coverage: {
        status: "ok",
        articles: equsto.articles.length,
        rehberSlugs: equsto.slugs.filter((s) => s.includes("-")).length,
      },
      weekly_schedule: {
        status: weeklyDraftCreated ? "ok" : "info",
        week: weekKey,
        lastDraftWeek: state.lastDraftWeek || null,
        message: weeklyDraftCreated
          ? "Bu hafta için yeni taslak oluşturuldu"
          : "Bu hafta zaten taslak var veya boşluk yok",
      },
      ai: {
        status: process.env.ANTHROPIC_API_KEY ? "ok" : "warn",
        message: process.env.ANTHROPIC_API_KEY
          ? "Claude ile genişletilmiş içerik üretilebilir"
          : "ANTHROPIC_API_KEY yok — şablon taslak kullanılır",
      },
    },
    gapTopics: gapTopics.slice(0, 15),
    latestDraft,
    drafts: listDrafts().slice(0, 10),
    aiSummary: null,
    message: weeklyDraftCreated
      ? `Haftalık taslak: ${latestDraft?.h1 || latestDraft?.slug}`
      : undefined,
  };

  return report;
}
