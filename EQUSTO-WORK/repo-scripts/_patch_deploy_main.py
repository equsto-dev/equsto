import re
from pathlib import Path

p = Path(r"C:\D Disk\EQUSTO-CURSOR\scripts\deploy-cpanel-sftp.mjs")
c = p.read_text(encoding="utf-8")

helpers = r'''
function loadDeployConfig() {
  try {
    return deployConfigFromEnv();
  } catch (e) {
    if (e.code === "ENV_MISSING") {
      console.error("[cpanel-deploy]", e.message);
      console.error("  Kurulum: deploy/CPANEL-SFTP-KURULUM.md");
    } else {
      console.error("[cpanel-deploy]", e.message || e);
    }
    process.exit(1);
  }
}

async function listRemote(transport, remoteDir, sub = "") {
  if (transport.mode === "ftp") {
    return transport.list(sub || ".");
  }
  const dir = sub ? remotePath(remoteDir, sub) : remoteDir;
  return transport.list(dir);
}

async function statRemote(transport, remoteDir, rel) {
  if (transport.mode === "ftp") {
    return transport.stat(rel);
  }
  return transport.stat(remotePath(remoteDir, rel));
}

async function uploadRemote(transport, remoteDir, local, rel) {
  const abs = remotePath(remoteDir, rel);
  await transport.upload(local, abs);
}

'''

if "function loadDeployConfig" not in c:
    c = c.replace("async function main()", helpers + "async function main()", 1)

new_main_tail = r'''  let transport;
  try {
    const cfg = loadDeployConfig();
    const remoteDir = cfg.remoteDir;
    console.log(
      "[cpanel-deploy] Baglaniyor:",
      cfg.user + "@" + cfg.host + ":" + cfg.port,
      cfg.useFtp ? "(FTP)" : "(SFTP)"
    );
    console.log("[cpanel-deploy] Uzak klasor:", remoteDir);
    transport = await connectDeploy(cfg);
    console.log("[cpanel-deploy] Baglanti OK —", transport.label);

    if (args.check) {
      const list = await listRemote(transport, remoteDir);
      console.log("[cpanel-deploy] public_html ornek:", list.slice(0, 8).map((e) => e.name).join(", "));
      return;
    }

    if (args.info) {
      const list = await listRemote(transport, remoteDir);
      console.log("[cpanel-deploy] public_html:", list.length, "oge");
      console.log(
        "[cpanel-deploy] Kok:",
        list.slice(0, 20).map((e) => `${e.name}${e.type === "d" ? "/" : ""}`).join(", ")
      );

      async function probe(rel) {
        try {
          const st = await statRemote(transport, remoteDir, rel);
          const sz = st.size != null ? `${(st.size / 1024).toFixed(1)} KB` : st.type;
          console.log(`  [OK] ${rel} — ${sz}`);
          return true;
        } catch (_) {
          console.log(`  [YOK] ${rel}`);
          return false;
        }
      }

      await probe("sogutma.html");
      await probe("yikama.html");
      await probe("data/ekipmanlar.json");
      await probe("nav.js");
      await probe("eq-dept-plp.js");

      try {
        const imgs = await listRemote(transport, remoteDir, "data/images");
        const imgCount = imgs.filter((e) => e.type !== "d").length;
        console.log(`  [data/images] ${imgCount} dosya (ilk sayim; alt klasorler dahil degil)`);
      } catch (_) {
        console.log("  [YOK] data/images/ — urun fotolari klasoru yok (404 nedeni)");
      }

      try {
        const dept = await listRemote(transport, remoteDir, "data/dept");
        console.log("  [data/dept]", dept.map((e) => e.name).join(", "));
      } catch (_) {
        console.log("  [YOK] data/dept/");
      }
      return;
    }

    let ok = 0;
    let skip = 0;
    let synced = 0;
    const isImages = args.preset === "images" || args.syncImages;
    for (let fi = 0; fi < files.length; fi++) {
      const rel = files[fi];
      const local = path.join(dist, rel);
      let src = local;
      if (!fs.existsSync(local)) {
        const pub = path.join(root, "public", rel);
        if (fs.existsSync(pub)) src = pub;
        else {
          console.warn("[cpanel-deploy] ATLANDI (dosya yok):", rel);
          skip++;
          continue;
        }
      }
      const remote = remotePath(remoteDir, rel);
      if (args.dryRun) {
        console.log("[dry-run]", rel, "->", remote);
        ok++;
        continue;
      }
      if (isImages) {
        try {
          const st = await statRemote(transport, remoteDir, rel);
          const locSz = fs.statSync(src).size;
          if (st && st.size === locSz) {
            skip++;
            if ((fi + 1) % 500 === 0) console.log("[sync]", fi + 1, "/", files.length, "atlandi (zaten var)");
            continue;
          }
        } catch (_) {}
      }
      await uploadRemote(transport, remoteDir, src, rel);
      synced++;
      ok++;
      if (isImages && synced % 200 === 0) {
        console.log("[sync]", synced, "yeni yuklendi,", skip, "zaten vardi,", fi + 1, "/", files.length);
      } else if (!isImages) {
        const kb = (fs.statSync(src).size / 1024).toFixed(1);
        console.log("[yuklendi]", rel, `(${kb} KB)`);
      }
    }
    console.log(`\n[cpanel-deploy] Bitti: ${ok} dosya${skip ? `, ${skip} atlandi` : ""}`);
    if (!args.dryRun) {
      console.log("[cpanel-deploy] Cloudflare Purge + tarayici Ctrl+F5 onerilir.");
    }
  } finally {
    if (transport) await transport.close().catch(() => {});
  }
}

main().catch((e) => {
  console.error("[cpanel-deploy] Hata:", e.message || e);
  if (/auth|password|denied/i.test(String(e.message))) {
    console.error("  FTP sifresi / kullanici adi kontrol edin. equsto.com: port 21 (FTP), SFTP (22) kapali olabilir.");
  }
  if (/ECONNREFUSED/.test(String(e.message))) {
    console.error("  .env: CPANEL_SFTP_PORT=21 veya CPANEL_USE_FTP=1");
  }
  process.exit(1);
});
'''

pattern = r"  const \{ cfg, remoteDir \} = sftpConfig\(\);.*?^}\n\nmain\(\)\.catch.*?\n\}\);\n"
m = re.search(pattern, c, re.S | re.M)
if not m:
    raise SystemExit("pattern not found")
c = c[:m.start()] + new_main_tail
c = c.replace("[cpanel-sftp]", "[cpanel-deploy]")
p.write_text(c, encoding="utf-8")
print("patched ok", len(c))
