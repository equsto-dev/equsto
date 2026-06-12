/** Docker içi Chromium PDF smoke test */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const executablePath = process.env.CHROMIUM_LOCAL_EXEC_PATH || "/usr/bin/chromium";
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pfos-chrome-test-"));
const args = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-breakpad",
  "--disable-crash-reporter",
  "--no-crash-upload",
  "--headless=new",
];

const browser = await puppeteer.launch({
  executablePath,
  args,
  headless: true,
  userDataDir,
});

try {
  const page = await browser.newPage();
  await page.setContent("<h1>PFOS PDF test</h1>", { waitUntil: "load" });
  const pdf = await page.pdf({ format: "A4" });
  console.log("OK pdf-bytes", pdf.length);
} finally {
  await browser.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
