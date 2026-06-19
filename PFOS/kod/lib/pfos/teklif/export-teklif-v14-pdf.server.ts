import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import type { TeklifModelV14 } from "./teklif-v14.types";
import { buildTeklifV14PrintHtml } from "./build-teklif-v14-print-html";
import { enrichTeklifV14ModelGorsel } from "./enrich-teklif-v14-gorsel.server";
import { sanitizeTeklifV14ModelForExport } from "./sanitize-teklif-v14-export";

const CHROMIUM_PACK_X64 =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://equsto.com";
}

function isSystemChromiumPath(executablePath: string): boolean {
  return (
    executablePath.includes("/usr/bin/chromium") ||
    executablePath.includes("/usr/bin/google-chrome")
  );
}

async function resolveChromiumExecutablePath(): Promise<string> {
  const local = process.env.CHROMIUM_LOCAL_EXEC_PATH?.trim();
  if (local) return local;

  if (process.platform === "linux" && fs.existsSync("/usr/bin/chromium")) {
    return "/usr/bin/chromium";
  }

  const remote =
    process.env.CHROMIUM_REMOTE_EXEC_PATH?.trim() || CHROMIUM_PACK_X64;
  return chromium.executablePath(remote);
}

/** Debian/Docker sistem Chromium — crashpad / sandbox sorunlarını önler */
function pdfBrowserLaunchArgs(executablePath: string): string[] {
  if (isSystemChromiumPath(executablePath)) {
    return [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-extensions",
      "--disable-breakpad",
      "--disable-crash-reporter",
      "--no-crash-upload",
      "--headless=new",
    ];
  }
  return chromium.args;
}

/** Sunucu — PFOS v14 PDF (e-posta / WhatsApp eki) */
export async function generateTeklifV14PdfBuffer(
  model: TeklifModelV14,
): Promise<Buffer> {
  chromium.setGraphicsMode = false;

  const cleaned = sanitizeTeklifV14ModelForExport(model);
  const enriched = await enrichTeklifV14ModelGorsel(cleaned);
  const html = buildTeklifV14PrintHtml(enriched, {
    siteOrigin: siteOrigin(),
    autoPrint: false,
  });

  const executablePath = await resolveChromiumExecutablePath();
  const systemChrome = isSystemChromiumPath(executablePath);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pfos-chrome-"));
  const browser = await puppeteer.launch({
    args: pdfBrowserLaunchArgs(executablePath),
    executablePath,
    headless: systemChrome ? true : "shell",
    userDataDir,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setContent(html, { waitUntil: "load", timeout: 90_000 });
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
        ),
      ),
    );
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* tmp temizliği isteğe bağlı */
    }
  }
}
