import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import type { TeklifModelV14 } from "./teklif-v14.types";
import { buildTeklifV14PrintHtml } from "./build-teklif-v14-print-html";

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://equsto.com";
}

/** Sunucu — PFOS v14 PDF (e-posta / WhatsApp eki) */
export async function generateTeklifV14PdfBuffer(
  model: TeklifModelV14,
): Promise<Buffer> {
  const html = buildTeklifV14PrintHtml(model, {
    siteOrigin: siteOrigin(),
    autoPrint: false,
  });

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
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
