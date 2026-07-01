#!/usr/bin/env node
/**
 * equsto.com canlı deploy — tek komut.
 *
 * Varsayılan: GitHub Actions (Hetzner deploy workflow) tetikler ve izler.
 * Alternatif: npm run deploy:canli -- --ssh  → sunucuda hetzner-deploy.sh
 *
 * Ortam değişkenleri (SSH modu):
 *   HETZNER_HOST          (varsayılan: 167.233.86.144)
 *   HETZNER_USER          (varsayılan: root)
 *   DEPLOY_SSH_IDENTITY   (varsayılan: ~/.ssh/equsto_deploy_new)
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const args = process.argv.slice(2);
const useSsh = args.includes("--ssh");
const skipWatch = args.includes("--no-watch");
const host = process.env.HETZNER_HOST?.trim() || "167.233.86.144";
const sshUser = process.env.HETZNER_USER?.trim() || "root";

function defaultIdentity() {
  const candidates = [
    process.env.DEPLOY_SSH_IDENTITY,
    join(homedir(), ".ssh", "equsto_deploy_new"),
    join(homedir(), ".ssh", "equsto"),
    join(homedir(), ".ssh", "id_ed25519"),
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) ?? "";
}

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    stdio: "inherit",
    encoding: "utf8",
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  return r;
}

function hasGh() {
  const r = spawnSync("gh", ["--version"], { stdio: "ignore" });
  return r.status === 0;
}

function ghAuthOk() {
  const r = spawnSync("gh", ["auth", "status"], { encoding: "utf8" });
  return r.status === 0;
}

function deployViaGithubActions() {
  console.log("[deploy:canli] GitHub Actions → Hetzner deploy");
  console.log("[deploy:canli] main dalı sunucuda güncellenecek (git pull + docker build)");

  run("gh", ["workflow", "run", "hetzner-deploy.yml", "--ref", "main"]);

  if (skipWatch) {
    console.log("[deploy:canli] Workflow kuyruğa alındı. İzlemek için:");
    console.log("  gh run watch --workflow hetzner-deploy.yml");
    return;
  }

  console.log("[deploy:canli] Workflow kuyruğa alındı, run aranıyor…");
  let runId = null;
  for (let attempt = 0; attempt < 8 && !runId; attempt += 1) {
    spawnSync("node", ["-e", "setTimeout(()=>{}, 2000)"]);
    const list = spawnSync(
      "gh",
      [
        "run",
        "list",
        "--workflow=hetzner-deploy.yml",
        "--limit",
        "1",
        "--json",
        "databaseId,status,conclusion",
      ],
      { encoding: "utf8" },
    );
    if (list.status !== 0) continue;
    try {
      const runs = JSON.parse(list.stdout || "[]");
      const candidate = runs[0]?.databaseId;
      const status = runs[0]?.status;
      if (candidate && status !== "completed") {
        runId = candidate;
      } else if (candidate && attempt >= 4) {
        runId = candidate;
      }
    } catch {
      /* retry */
    }
  }

  if (!runId) {
    console.error("[deploy:canli] Workflow bulunamadı — GitHub → Actions sekmesinden izleyin.");
    process.exit(1);
  }

  console.log(`[deploy:canli] İzleniyor: run ${runId} (yaklaşık 3–5 dk)`);
  run("gh", ["run", "watch", String(runId), "--exit-status"]);
  console.log("[deploy:canli] Tamam — https://equsto.com/");
}

function deployViaSsh() {
  const identity = defaultIdentity();
  if (!identity) {
    console.error(
      "[deploy:canli] SSH anahtarı bulunamadı. DEPLOY_SSH_IDENTITY ayarlayın veya gh ile deploy edin.",
    );
    process.exit(1);
  }

  const remote = `${sshUser}@${host}`;
  const cmd =
    "set -euo pipefail && cd /opt/equsto/E-TICARET/site && bash scripts/hetzner-deploy.sh";

  console.log(`[deploy:canli] SSH → ${remote}`);
  console.log(`[deploy:canli] Anahtar: ${identity}`);

  run("ssh", [
    "-i",
    identity,
    "-o",
    "BatchMode=no",
    "-o",
    "StrictHostKeyChecking=accept-new",
    remote,
    cmd,
  ]);
  console.log("[deploy:canli] Tamam — https://equsto.com/");
}

function printHelp() {
  console.log(`
equsto.com canlı deploy

  npm run deploy:canli           GitHub Actions (önerilen)
  npm run deploy:canli -- --ssh    Doğrudan sunucu SSH
  npm run deploy:canli -- --no-watch   Workflow tetikle, bekleme

Ön koşul (GH): gh auth login
Ön koşul (SSH): public key sunucuda authorized_keys içinde

Otomatik deploy: main'e push (E-TICARET/site/**) zaten workflow'u çalıştırır.
`);
}

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

process.chdir(siteDir);

if (useSsh) {
  deployViaSsh();
} else if (hasGh() && ghAuthOk()) {
  deployViaGithubActions();
} else if (defaultIdentity()) {
  console.log("[deploy:canli] gh yok veya oturum kapalı — SSH moduna geçiliyor (--ssh)");
  deployViaSsh();
} else {
  console.error("[deploy:canli] Ne GitHub CLI (gh auth login) ne de SSH anahtarı hazır.");
  printHelp();
  process.exit(1);
}
