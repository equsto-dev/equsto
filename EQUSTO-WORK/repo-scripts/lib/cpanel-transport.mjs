/**
 * cPanel yukleme: SFTP (22) veya FTP (21) â€” host portuna gore.
 */
import fs from "node:fs";
import path from "node:path";

export function deployConfigFromEnv() {
  const host = String(process.env.CPANEL_SFTP_HOST || "").trim();
  const user = String(process.env.CPANEL_SFTP_USER || "").trim();
  const pass = String(process.env.CPANEL_SFTP_PASSWORD || "").trim();
  const port = Number(process.env.CPANEL_SFTP_PORT || 21) || 22;
  const remoteDir = String(process.env.CPANEL_SFTP_REMOTE_DIR || "/public_html").trim() || "/public_html";
  const keyPath = String(process.env.CPANEL_SFTP_KEY_PATH || "").trim();
  const forceFtp = ["1", "true", "yes"].includes(String(process.env.CPANEL_USE_FTP || "").trim().toLowerCase());

  if (!host || !user) {
    const err = new Error("Eksik: CPANEL_SFTP_HOST ve CPANEL_SFTP_USER (.env)");
    err.code = "ENV_MISSING";
    throw err;
  }
  if (!pass && !keyPath) {
    const err = new Error("CPANEL_SFTP_PASSWORD veya CPANEL_SFTP_KEY_PATH gerekli");
    err.code = "ENV_MISSING";
    throw err;
  }

  const useFtp = forceFtp || port === 21;
  return { host, user, pass, port, remoteDir: remoteDir.replace(/\\/g, "/").replace(/\/+$/, ""), keyPath, useFtp };
}

export function remotePath(remoteDir, rel) {
  return `${remoteDir}/${rel.replace(/\\/g, "/")}`;
}

function ftpRemoteDir(remoteDir) {
  return remoteDir.replace(/^\//, "") || ".";
}

async function ensureSftpDir(sftp, dir) {
  const parts = dir.split("/").filter(Boolean);
  let cur = "";
  for (const p of parts) {
    cur += "/" + p;
    try {
      await sftp.mkdir(cur, true);
    } catch (_) {}
  }
}

async function createSftpTransport(cfg, remoteDir) {
  let Client;
  try {
    Client = (await import("ssh2-sftp-client")).default;
  } catch (_) {
    const err = new Error("ssh2-sftp-client yuklu degil â€” npm install");
    err.code = "DEPS";
    throw err;
  }

  const sftp = new Client();
  const connectCfg = {
    host: cfg.host,
    port: cfg.port,
    username: cfg.user,
    readyTimeout: 30000,
    retries: 2,
    retry_factor: 2,
  };
  if (cfg.keyPath) {
    connectCfg.privateKey = fs.readFileSync(cfg.keyPath, "utf8");
    if (process.env.CPANEL_SFTP_KEY_PASSPHRASE) {
      connectCfg.passphrase = process.env.CPANEL_SFTP_KEY_PASSPHRASE;
    }
  } else {
    connectCfg.password = cfg.pass;
  }

  await sftp.connect(connectCfg);

  return {
    mode: "sftp",
    label: `SFTP ${cfg.user}@${cfg.host}:${cfg.port}`,
    remoteDir,
    async list(dir) {
      return sftp.list(dir);
    },
    async stat(absPath) {
      return sftp.stat(absPath);
    },
    async upload(local, absPath) {
      const parent = absPath.replace(/\/[^/]+$/, "");
      await ensureSftpDir(sftp, parent);
      await sftp.fastPut(local, absPath);
    },
    async close() {
      await sftp.end().catch(() => {});
    },
  };
}

async function createFtpTransport(cfg, remoteDir) {
  let FtpClient;
  try {
    FtpClient = (await import("basic-ftp")).Client;
  } catch (_) {
    const err = new Error("basic-ftp yuklu degil â€” npm install");
    err.code = "DEPS";
    throw err;
  }

  const client = new FtpClient(120000);
  const secure = ["1", "true", "implicit"].includes(
    String(process.env.CPANEL_FTP_SECURE || "").trim().toLowerCase()
  );
  await client.access({
    host: cfg.host,
    user: cfg.user,
    password: cfg.pass,
    port: cfg.port === 22 ? 21 : cfg.port,
    secure: secure === true ? true : false,
  });

  const base = ftpRemoteDir(remoteDir);
  try {
    if (base && base !== ".") {
      await client.ensureDir(base);
      await client.cd(base);
    }
  } catch (e) {
    if (/public_html/i.test(base) && /550|No such file|not found/i.test(String(e.message))) {
      // FTP hesabi genelde zaten public_html kokunde
    } else {
      throw e;
    }
  }

  return {
    mode: "ftp",
    label: `FTP ${cfg.user}@${cfg.host}:${cfg.port === 22 ? 21 : cfg.port}`,
    remoteDir,
    cwd: base,
    async list(sub = ".") {
      const items = await client.list(sub === "." ? undefined : sub);
      return items.map((e) => ({
        name: e.name,
        type: e.isDirectory ? "d" : "-",
        size: e.size,
      }));
    },
    async stat(relPath) {
      const sz = await client.size(relPath);
      return { size: sz, type: "-" };
    },
    async upload(local, absPath) {
      const rel = absPath.startsWith(remoteDir + "/")
        ? absPath.slice(remoteDir.length + 1)
        : absPath.replace(/^\//, "");
      const home = await client.pwd();
      const parts = rel.split("/").filter(Boolean);
      if (parts.length > 1) {
        let built = "";
        for (let i = 0; i < parts.length - 1; i++) {
          built = built ? `${built}/${parts[i]}` : parts[i];
          try {
            await client.ensureDir(built);
          } catch (e) {
            if (!/550|exists|file exists/i.test(String(e.message))) throw e;
          }
        }
        await client.cd(home);
      }
      await client.uploadFrom(local, rel);
    },
    async close() {
      client.close();
    },
  };
}

export async function connectDeploy(cfg) {
  if (cfg.useFtp) {
    return createFtpTransport({ ...cfg, port: cfg.port === 22 ? 21 : cfg.port }, cfg.remoteDir);
  }
  try {
    return await createSftpTransport(cfg, cfg.remoteDir);
  } catch (e) {
    if (cfg.port === 22 && /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(String(e.message))) {
      console.log("[cpanel] Port 22 kapali â€” FTP (21) deneniyor (equsto.com tipik)...");
      return createFtpTransport({ ...cfg, port: 21, useFtp: true }, cfg.remoteDir);
    }
    throw e;
  }
}
