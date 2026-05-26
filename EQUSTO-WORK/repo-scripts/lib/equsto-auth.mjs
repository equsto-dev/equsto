/**
 * Equsto üye oturumu — /api/auth/*
 * Ortam: EQUSTO_GOOGLE_CLIENT_ID, EQUSTO_APPLE_CLIENT_ID, EQUSTO_APPLE_REDIRECT_URI
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveAuthStorePath() {
  if (process.env.EQUSTO_DATA_DIR) {
    return path.join(process.env.EQUSTO_DATA_DIR, 'equsto-auth-store.json');
  }
  const nearLib = path.join(__dirname, '..', 'data', 'equsto-auth-store.json');
  if (fs.existsSync(path.dirname(nearLib))) return nearLib;
  const cwdData = path.join(process.cwd(), 'data');
  fs.mkdirSync(cwdData, { recursive: true });
  return path.join(cwdData, 'equsto-auth-store.json');
}

const AUTH_STORE = resolveAuthStorePath();
const SESSION_DAYS = 30;

const GOOGLE_CLIENT_ID = (process.env.EQUSTO_GOOGLE_CLIENT_ID || '').trim();
const APPLE_CLIENT_ID = (process.env.EQUSTO_APPLE_CLIENT_ID || '').trim();
const APPLE_REDIRECT_URI = (process.env.EQUSTO_APPLE_REDIRECT_URI || 'https://equsto.com/login.html').trim();

let dbUsers = [];
let dbSessions = [];
/** @type {Record<string, object[]>} userId → sepet satırları */
let dbCarts = {};
let nextUserId = 1;
const MAX_CART_LINES = 250;

function loadAuthStore() {
  try {
    if (!fs.existsSync(AUTH_STORE)) return;
    const raw = JSON.parse(fs.readFileSync(AUTH_STORE, 'utf8') || '{}');
    dbUsers = Array.isArray(raw.users) ? raw.users : [];
    dbSessions = Array.isArray(raw.sessions) ? raw.sessions : [];
    dbCarts = raw.carts && typeof raw.carts === 'object' && !Array.isArray(raw.carts) ? raw.carts : {};
    let maxId = 0;
    dbUsers.forEach((u) => {
      if (u && u.id > maxId) maxId = u.id;
    });
    nextUserId = maxId + 1;
    pruneExpiredSessions();
  } catch (e) {
    console.warn('[equsto-auth] store okunamadi:', e.message || e);
  }
}

function saveAuthStore() {
  try {
    fs.mkdirSync(path.dirname(AUTH_STORE), { recursive: true });
    fs.writeFileSync(
      AUTH_STORE,
      JSON.stringify({ users: dbUsers, sessions: dbSessions, carts: dbCarts }, null, 2),
      'utf8',
    );
  } catch (e) {
    console.warn('[equsto-auth] store yazilamadi:', e.message || e);
  }
}

function pruneExpiredSessions() {
  const now = Date.now();
  dbSessions = dbSessions.filter((s) => s && s.expiresAt > now);
}

function normEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const actual = scryptSync(password, salt, 64);
    return timingSafeEqual(expected, actual);
  } catch (_) {
    return false;
  }
}

function newToken() {
  return randomBytes(32).toString('hex');
}

function createSession(userId) {
  pruneExpiredSessions();
  const token = newToken();
  const now = Date.now();
  const sess = {
    token,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  dbSessions.push(sess);
  saveAuthStore();
  return sess;
}

function findSession(token) {
  if (!token) return null;
  pruneExpiredSessions();
  return dbSessions.find((s) => s.token === token) || null;
}

function findUserById(id) {
  return dbUsers.find((u) => u.id === id) || null;
}

function findUserByEmail(email) {
  const e = normEmail(email);
  return dbUsers.find((u) => normEmail(u.email) === e) || null;
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name || '',
    provider: u.lastProvider || (u.providers && u.providers[0]) || 'email',
    picture: u.picture || '',
  };
}

function sessionPayload(user, token) {
  return {
    token,
    user: publicUser(user),
    expiresAt: findSession(token)?.expiresAt || null,
    items: getCartForUser(user.id),
  };
}

function upsertOAuthUser({ email, name, picture, provider, sub }) {
  const e = normEmail(email);
  if (!e) throw new Error('E-posta adresi alınamadı');

  let user = dbUsers.find((u) => {
    if (provider === 'google' && u.googleSub && u.googleSub === sub) return true;
    if (provider === 'apple' && u.appleSub && u.appleSub === sub) return true;
    return normEmail(u.email) === e;
  });

  if (!user) {
    user = {
      id: nextUserId++,
      email: e,
      name: name || e.split('@')[0],
      picture: picture || '',
      passwordHash: null,
      providers: [provider],
      googleSub: provider === 'google' ? sub : null,
      appleSub: provider === 'apple' ? sub : null,
      createdAt: new Date().toISOString(),
      lastProvider: provider,
    };
    dbUsers.push(user);
  } else {
    if (name && !user.name) user.name = name;
    if (picture) user.picture = picture;
    if (!user.providers) user.providers = [];
    if (user.providers.indexOf(provider) < 0) user.providers.push(provider);
    if (provider === 'google') user.googleSub = sub;
    if (provider === 'apple') user.appleSub = sub;
    user.lastProvider = provider;
    if (!user.email) user.email = e;
  }
  saveAuthStore();
  return user;
}

async function verifyGoogleCredential(credential) {
  if (!credential) throw new Error('Google jetonu eksik');
  const url =
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential);
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Google doğrulaması başarısız');
  }
  if (GOOGLE_CLIENT_ID && data.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Google istemci kimliği eşleşmiyor');
  }
  if (data.email_verified !== 'true' && data.email_verified !== true) {
    throw new Error('Google e-postası doğrulanmamış');
  }
  return {
    email: data.email,
    name: data.name || '',
    picture: data.picture || '',
    sub: data.sub,
  };
}

let appleJwks;
async function getAppleJwks() {
  if (!appleJwks) {
    let jose;
    try {
      jose = await import('jose');
    } catch (_) {
      throw new Error('Apple girişi için `npm install jose` gerekli');
    }
    appleJwks = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
  }
  return appleJwks;
}

async function verifyAppleIdToken(idToken) {
  if (!idToken) throw new Error('Apple jetonu eksik');
  if (!APPLE_CLIENT_ID) throw new Error('EQUSTO_APPLE_CLIENT_ID tanımlı değil');
  let jose;
  try {
    jose = await import('jose');
  } catch (_) {
    throw new Error('Apple girişi için sunucuda jose paketi yüklü olmalı (npm install jose)');
  }
  const jwks = await getAppleJwks();
  const { payload } = await jose.jwtVerify(idToken, jwks, {
    issuer: 'https://appleid.apple.com',
    audience: APPLE_CLIENT_ID,
  });
  const email = payload.email;
  if (!email) throw new Error('Apple e-postası paylaşılmadı (ilk girişte izin verin)');
  return {
    email,
    name: '',
    picture: '',
    sub: payload.sub,
  };
}

function getBearer(req, bodyToken) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  if (m) return m[1].trim();
  const x = req.headers['x-equsto-authorization'] || req.headers['X-Equsto-Authorization'];
  if (x) return String(x).trim();
  if (bodyToken) return String(bodyToken).trim();
  try {
    const u = new URL(req.url || '/', 'http://127.0.0.1');
    const q = u.searchParams.get('access_token');
    if (q) return String(q).trim();
  } catch (_) {}
  return '';
}

function cartLineId(it) {
  const n = String(it.n || '').trim();
  const b = String(it.b || '').trim();
  const c = String(it.c || '').trim();
  const s = `${c}\t${b}\t${n}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return 'eq' + (h >>> 0).toString(36);
}

function sanitizeCartItems(raw) {
  if (!Array.isArray(raw)) return [];
  const map = {};
  for (let i = 0; i < raw.length; i++) {
    const x = raw[i];
    if (!x || typeof x !== 'object') continue;
    const n = String(x.n || '').trim();
    const b = String(x.b || '').trim();
    if (!n && !b) continue;
    const q = Math.max(1, Math.round(Number(x.q) || 1));
    const id = String(x.id || '').trim() || cartLineId({ n, b, c: String(x.c || '').trim() });
    if (map[id]) {
      map[id].q = Math.max(map[id].q, q);
      if (x.p) map[id].p = String(x.p).trim();
    } else {
      map[id] = {
        id,
        n,
        b,
        c: String(x.c || '').trim(),
        p: String(x.p || '').trim(),
        q,
      };
    }
  }
  const out = Object.keys(map).map((k) => map[k]);
  return out.length > MAX_CART_LINES ? out.slice(0, MAX_CART_LINES) : out;
}

function getCartForUser(userId) {
  const key = String(userId);
  return sanitizeCartItems(dbCarts[key] || []);
}

function setCartForUser(userId, items) {
  const key = String(userId);
  const clean = sanitizeCartItems(items);
  if (!clean.length) delete dbCarts[key];
  else dbCarts[key] = clean;
  saveAuthStore();
  return clean;
}

/** PC + mobil aynı anda yazınca satırlar birleşir (adet: max, silme yok). */
function mergeCartForUser(userId, incoming) {
  const existing = getCartForUser(userId);
  const merged = sanitizeCartItems(existing.concat(Array.isArray(incoming) ? incoming : []));
  return setCartForUser(userId, merged);
}

loadAuthStore();

/**
 * @returns {Promise<boolean>} true = istek işlendi
 */
export async function tryHandleEqustoAuth(req, res, ctx) {
  const { API_PREFIX, method, pathname, readBody, parseBody, sendJson } = ctx;
  if (!pathname.startsWith(`${API_PREFIX}/auth`)) return false;

  /** sendJson yanıt döndürür; proxy "işlendi" için true bekler. */
  function respond(status, obj) {
    sendJson(res, status, obj);
    return true;
  }

  if (method === 'GET' && pathname === `${API_PREFIX}/auth/config`) {
    return respond(200, {
      success: true,
      googleClientId: GOOGLE_CLIENT_ID,
      appleClientId: APPLE_CLIENT_ID,
      appleRedirectURI: APPLE_REDIRECT_URI,
      authEnabled: true,
    });
  }

  if (method === 'POST' && pathname === `${API_PREFIX}/auth/register`) {
    const body = parseBody(await readBody(req));
    if (!body) return respond(400, { success: false, error: 'Geçersiz JSON' });
    const email = normEmail(body.email);
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond(400, { success: false, error: 'Geçerli bir e-posta girin' });
    }
    if (password.length < 8) {
      return respond(400, { success: false, error: 'Şifre en az 8 karakter olmalı' });
    }
    if (findUserByEmail(email)) {
      return respond(409, { success: false, error: 'Bu e-posta zaten kayıtlı' });
    }
    const user = {
      id: nextUserId++,
      email,
      name: name || email.split('@')[0],
      picture: '',
      passwordHash: hashPassword(password),
      providers: ['email'],
      googleSub: null,
      appleSub: null,
      createdAt: new Date().toISOString(),
      lastProvider: 'email',
    };
    dbUsers.push(user);
    saveAuthStore();
    const sess = createSession(user.id);
    return respond(201, { success: true, ...sessionPayload(user, sess.token) });
  }

  if (method === 'POST' && pathname === `${API_PREFIX}/auth/login`) {
    const body = parseBody(await readBody(req));
    if (!body) return respond(400, { success: false, error: 'Geçersiz JSON' });
    const email = normEmail(body.email);
    const password = String(body.password || '');
    const user = findUserByEmail(email);
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return respond(401, { success: false, error: 'E-posta veya şifre hatalı' });
    }
    user.lastProvider = 'email';
    saveAuthStore();
    const sess = createSession(user.id);
    return respond(200, { success: true, ...sessionPayload(user, sess.token) });
  }

  if (method === 'POST' && pathname === `${API_PREFIX}/auth/google`) {
    try {
      const body = parseBody(await readBody(req));
      if (!body) return respond(400, { success: false, error: 'Geçersiz JSON' });
      const profile = await verifyGoogleCredential(body.credential || body.id_token);
      const user = upsertOAuthUser({ ...profile, provider: 'google' });
      const sess = createSession(user.id);
      return respond(200, { success: true, ...sessionPayload(user, sess.token) });
    } catch (e) {
      return respond(401, { success: false, error: e.message || 'Google girişi başarısız' });
    }
  }

  if (method === 'POST' && pathname === `${API_PREFIX}/auth/apple`) {
    try {
      const body = parseBody(await readBody(req));
      if (!body) return respond(400, { success: false, error: 'Geçersiz JSON' });
      const idToken =
        body.id_token ||
        (body.authorization && body.authorization.id_token) ||
        (body.identityToken);
      const profile = await verifyAppleIdToken(idToken);
      const user = upsertOAuthUser({ ...profile, provider: 'apple' });
      const sess = createSession(user.id);
      return respond(200, { success: true, ...sessionPayload(user, sess.token) });
    } catch (e) {
      return respond(401, { success: false, error: e.message || 'Apple girişi başarısız' });
    }
  }

  if (pathname === `${API_PREFIX}/auth/me`) {
    let meBody = null;
    if (method === 'PUT' || method === 'POST') {
      meBody = parseBody(await readBody(req));
    }
    const token = getBearer(req, meBody && meBody.token);
    const sess = findSession(token);
    if (!sess) return respond(401, { success: false, error: 'Oturum geçersiz' });
    const user = findUserById(sess.userId);
    if (!user) return respond(401, { success: false, error: 'Kullanıcı bulunamadı' });

    if (method === 'GET') {
      return respond(200, { success: true, ...sessionPayload(user, token) });
    }

    if (method === 'PUT' || method === 'POST') {
      if (!meBody) return respond(400, { success: false, error: 'Geçersiz JSON' });
      if (Array.isArray(meBody.items)) {
        mergeCartForUser(user.id, meBody.items);
      }
      return respond(200, {
        success: true,
        ...sessionPayload(user, token),
        items: getCartForUser(user.id),
      });
    }
  }

  if (method === 'POST' && pathname === `${API_PREFIX}/auth/logout`) {
    const token = getBearer(req) || (parseBody(await readBody(req)) || {}).token;
    if (token) {
      dbSessions = dbSessions.filter((s) => s.token !== token);
      saveAuthStore();
    }
    return respond(200, { success: true });
  }

  if (pathname === `${API_PREFIX}/auth/cart`) {
    let cartBody = null;
    if (method === 'PUT' || method === 'POST') {
      cartBody = parseBody(await readBody(req));
    }
    const token = getBearer(req, cartBody && cartBody.token);
    const sess = findSession(token);
    if (!sess) return respond(401, { success: false, error: 'Oturum geçersiz' });
    const user = findUserById(sess.userId);
    if (!user) return respond(401, { success: false, error: 'Kullanıcı bulunamadı' });

    if (method === 'GET') {
      const items = getCartForUser(user.id);
      return respond(200, { success: true, items, updatedAt: Date.now() });
    }

    if (method === 'PUT' || method === 'POST') {
      if (!cartBody) return respond(400, { success: false, error: 'Geçersiz JSON' });
      const items = mergeCartForUser(user.id, cartBody.items);
      return respond(200, { success: true, items, updatedAt: Date.now() });
    }
  }

  return respond(404, { success: false, error: 'Auth endpoint bulunamadı' });
}

export async function equstoAuthStartupLog() {
  let joseStatus = 'missing';
  try {
    await import('jose');
    joseStatus = 'ok';
  } catch (_) {}
  console.log(
    `[equsto-auth] google=${GOOGLE_CLIENT_ID ? 'set' : 'missing'} apple=${APPLE_CLIENT_ID ? 'set' : 'missing'} jose=${joseStatus}`,
  );
}
