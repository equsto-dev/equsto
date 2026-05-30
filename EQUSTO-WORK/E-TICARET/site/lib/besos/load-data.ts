import { readFile } from "fs/promises";
import fs from "node:fs";
import path from "path";
import { getSiteOrigin } from "@/lib/site-origin";
import type {
  BesosCatalogue,
  BesosHeroVideo,
  BesosLanding,
  BesosProjectsData,
} from "./types";

function dataPath(name: string): string {
  return path.join(process.cwd(), "public", "data", name);
}

/**
 * Vercel lambda: public/data/*.json trace dışı (next.config) — yerel yoksa CDN.
 */
async function readJson<T>(name: string): Promise<T> {
  const local = dataPath(name);
  try {
    if (fs.existsSync(local)) {
      const raw = await readFile(local, "utf8");
      return JSON.parse(raw) as T;
    }
  } catch {
    /* fetch fallback */
  }

  const res = await fetch(`${getSiteOrigin()}/data/${name}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Besos data ${name} fetch ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function loadBesosLanding(): Promise<BesosLanding> {
  return readJson<BesosLanding>("vitrum-bars-landing.json");
}

export async function loadBesosCatalogue(): Promise<BesosCatalogue> {
  return readJson<BesosCatalogue>("vitrum-bars-catalogue.json");
}

export async function loadBesosProjects(): Promise<BesosProjectsData> {
  return readJson<BesosProjectsData>("vitrum-bar-projects.json");
}

export async function loadBesosHeroVideo(): Promise<BesosHeroVideo> {
  const raw = await readJson<{ local?: BesosHeroVideo } & BesosHeroVideo>(
    "vitrum-bars-hero-video.json",
  );
  if (raw.local?.mp4) return raw.local;
  return raw;
}

export async function loadBesosPageData() {
  const [landing, catalogue, projects, heroVideo] = await Promise.all([
    loadBesosLanding(),
    loadBesosCatalogue(),
    loadBesosProjects(),
    loadBesosHeroVideo().catch(() => ({
      mp4: "/assets/besos/vitrum-bars-hero.mp4",
      webm: "/assets/besos/vitrum-bars-hero.webm",
      poster: "/assets/besos/vitrum-bars-hero-poster.jpg",
    })),
  ]);
  return { landing, catalogue, projects, heroVideo };
}
