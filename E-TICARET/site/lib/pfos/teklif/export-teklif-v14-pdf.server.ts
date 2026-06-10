import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import type { TeklifModelV14 } from "./teklif-v14.types";
import { buildTeklifV14PrintHtml } from "./build-teklif-v14-print-html";
import { enrichTeklifV14ModelGorsel } from "./enrich-teklif-v14-gorsel.server";

const CHROMIUM_PACK_X64 =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://equsto.com";
}

async function resolveChromiumExecutablePath(): Promise<string> {
  const local = process.env.CHROMIUM_LOCAL_EXEC_PATH?.trim();
  if (local) return local;

  const remote =
    process.env.CHROMIUM_REMOTE_EXEC_PATH?.trim() || CHROMIUM_PACK_X64;
  return chromium.executablePath(remote);
}

/** Sunucu — PFOS v14 PDF (e-posta / WhatsApp eki) */
export async function generateTeklifV14PdfBuffer(
  model: TeklifModelV14,
): Promise<Buffer> {
  chromium.setGraphicsMode = false;

  const enriched = await enrichTeklifV14ModelGorsel(model);
  const html = buildTeklifV14PrintHtml(enriched, {
    siteOrigin: siteOrigin(),
    autoPrint: false,
  });

  const executablePath = await resolveChromiumExecutablePath();
  const browser = await puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath,
    headless: "shell",
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
  }
}
