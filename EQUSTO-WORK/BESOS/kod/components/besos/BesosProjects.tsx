import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BESOS_STUDIO } from "@/lib/besos/branding";
import { besosAssetPath } from "@/lib/besos/asset-path";
import { besosRawCategoryKey, findBesosProduct } from "@/lib/besos/catalog";
import { besosModuleHrefFromProduct } from "@/lib/besos/module-url";
import type {
  BesosInterludeGroup,
  BesosProduct,
  BesosProject,
  BesosProjectsData,
} from "@/lib/besos/types";

type Props = {
  projectsData: BesosProjectsData;
  products: BesosProduct[];
};

function catGroupKey(cat: string): string {
  return besosRawCategoryKey(cat);
}

function buildInterludes(
  products: BesosProduct[],
  groups: BesosInterludeGroup[],
  usedSlugs: Record<string, boolean>,
) {
  const byCat: Record<string, BesosProduct[]> = {};
  for (const p of products) {
    const k = catGroupKey(p.category);
    if (!byCat[k]) byCat[k] = [];
    byCat[k].push(p);
  }

  const chunks: { label: string; items: BesosProduct[] }[] = [];
  for (const g of groups) {
    const items = (byCat[g.categoryKey] ?? []).filter((p) => p.slug && !usedSlugs[p.slug!]);
    if (!items.length) continue;
    items.sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
    const slice = items.slice(0, 4);
    for (const p of slice) {
      if (p.slug) usedSlugs[p.slug] = true;
    }
    chunks.push({ label: g.labelTr, items: slice });
  }

  const rest = products.filter((p) => p.slug && !usedSlugs[p.slug]);
  if (rest.length) {
    chunks.push({ label: "Katalogdan diğer modüller", items: rest.slice(0, 3) });
  }
  return chunks;
}

function GearPanel({
  mod,
  caption,
  compact,
}: {
  mod: BesosProduct | null;
  caption?: string;
  compact?: boolean;
}) {
  if (!mod) {
    return (
      <div className="bd-portfolio-panel bd-portfolio-panel--gear">
        <span className="bd-portfolio-panel-tag bd-portfolio-panel-tag--gear">{BESOS_STUDIO} modülü</span>
        <div className="bd-portfolio-empty">Modül bulunamadı</div>
      </div>
    );
  }

  const hero = mod.image ? besosAssetPath(mod.image) : "";
  const href = mod.slug ? besosModuleHrefFromProduct(mod) : "#";
  const title = mod.name || mod.code;
  const dim = mod.totalDimensionsMm ? `${mod.totalDimensionsMm} mm` : "";

  const media = hero ? (
    <div className="bd-portfolio-panel-media">
      <Image src={hero} alt={title} width={480} height={360} loading="lazy" unoptimized style={{ objectFit: "contain", width: "100%", height: "auto" }} />
    </div>
  ) : (
    <div className="bd-portfolio-empty">
      {mod.code}
      {dim ? ` · ${dim}` : ""}
    </div>
  );

  const foot = (
    <div className="bd-portfolio-panel-foot">
      <h4>{title}</h4>
      {caption ? <p>{caption}</p> : null}
      {dim ? <div className="bd-portfolio-dim">{dim}</div> : null}
      {mod.code ? <div className="bd-portfolio-dim">{mod.code}</div> : null}
      <Link href={href}>Modül sayfası →</Link>
    </div>
  );

  if (compact) {
    return (
      <Link href={href} className="bd-portfolio-gear-card">
        {media}
        {foot}
      </Link>
    );
  }

  return (
    <div className="bd-portfolio-panel bd-portfolio-panel--gear">
      <span className="bd-portfolio-panel-tag bd-portfolio-panel-tag--gear">{BESOS_STUDIO} modülü</span>
      {media}
      {foot}
    </div>
  );
}

function ProjectRow({
  project,
  index,
  products,
}: {
  project: BesosProject;
  index: number;
  products: BesosProduct[];
}) {
  const n = String(index + 1).padStart(2, "0");
  const loc = project.locationTr || project.location;
  const modules = project.featuredModules ?? [];
  const modA = modules[0] ? findBesosProduct(products, modules[0].slug) : null;
  const modB = modules[1] ? findBesosProduct(products, modules[1].slug) : null;

  return (
    <article className="bd-portfolio-row" id={`bd-proj-${project.slug}`}>
      <header className="bd-portfolio-row-hd">
        <span className="bd-portfolio-num">{n}</span>
        <h3>{project.name}</h3>
        <span className="bd-portfolio-meta">
          {loc}
          {project.year ? ` · ${project.year}` : ""}
        </span>
      </header>
      <div className="bd-portfolio-duo">
        <div className="bd-portfolio-panel bd-portfolio-panel--venue">
          <span className="bd-portfolio-panel-tag">Mekan</span>
          {project.image ? (
            <div className="bd-portfolio-panel-media">
              <Image
                src={project.image}
                alt={project.name}
                fill
                sizes="50vw"
                loading="lazy"
                unoptimized
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <div className="bd-portfolio-empty">{project.name}</div>
          )}
        </div>
        <div className="bd-portfolio-gear-col">
          <GearPanel mod={modA} caption={modules[0]?.captionTr} />
          {modB ? <GearPanel mod={modB} caption={modules[1]?.captionTr} /> : null}
        </div>
      </div>
      <div className="bd-portfolio-copy">
        {project.subtitleTr ? <p className="bd-portfolio-sub">{project.subtitleTr}</p> : null}
        <p>{project.teaserTr || project.teaser}</p>
        {project.quoteTr || project.quote ? (
          <blockquote className="bd-portfolio-quote">{project.quoteTr || project.quote}</blockquote>
        ) : null}
        <div className="bd-portfolio-links">
          {project.url ? (
            <Link href={project.url} target="_blank" rel="noopener noreferrer">
              Vitrum proje sayfası ↗
            </Link>
          ) : null}
          {modA ? (
            <Link href={besosModuleHrefFromProduct(modA)}>
              Besos modül · {modA.name || modA.code} →
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function BesosProjects({ projectsData, products }: Props) {
  const list = projectsData.projects ?? [];
  if (!list.length) return null;

  const usedSlugs: Record<string, boolean> = {};
  for (const pr of list) {
    for (const m of pr.featuredModules ?? []) {
      if (m.slug) usedSlugs[m.slug] = true;
    }
  }

  const interludes = buildInterludes(
    products,
    projectsData.interludeGroups ?? [],
    usedSlugs,
  );

  const blocks: ReactNode[] = [];
  let interludeIdx = 0;
  list.forEach((pr, i) => {
    blocks.push(<ProjectRow key={pr.slug} project={pr} index={i} products={products} />);
    if (i < list.length - 1 && interludes[interludeIdx]) {
      const chunk = interludes[interludeIdx];
      blocks.push(
        <section key={`interlude-${interludeIdx}`} className="bd-portfolio-interlude">
          <div className="bd-portfolio-interlude-hd">
            <p className="bd-vl-kicker">Katalog</p>
            <h3>{chunk.label}</h3>
          </div>
          <div className="bd-portfolio-gear-row">
            {chunk.items.map((p) => (
              <GearPanel key={p.slug ?? p.code} mod={p} compact />
            ))}
          </div>
        </section>,
      );
      interludeIdx += 1;
    }
  });
  while (interludeIdx < interludes.length) {
    const chunk = interludes[interludeIdx];
    blocks.push(
      <section key={`interlude-tail-${interludeIdx}`} className="bd-portfolio-interlude">
        <div className="bd-portfolio-interlude-hd">
          <p className="bd-vl-kicker">Katalog</p>
          <h3>{chunk.label}</h3>
        </div>
        <div className="bd-portfolio-gear-row">
          {chunk.items.map((p) => (
            <GearPanel key={p.slug ?? p.code} mod={p} compact />
          ))}
        </div>
      </section>,
    );
    interludeIdx += 1;
  }

  return (
    <section className="bd-vl-projects" id="bd-vitrum-projects" aria-label="Bar projeleri">
      <div className="bd-vl-projects-head">
        <p className="bd-vl-kicker">Öne çıkan projeler</p>
        <h2>Öne çıkan projeler</h2>
        <p>
          Saha projeleri ve {BESOS_STUDIO} katalog modülleri yan yana.
        </p>
      </div>
      <div className="bd-portfolio">{blocks}</div>
    </section>
  );
}
