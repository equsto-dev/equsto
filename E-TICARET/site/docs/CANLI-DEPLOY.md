# Canlıya alma (equsto.com)

**Canlı ortam:** Hetzner Docker (`167.233.86.144`) — Vercel kullanılmıyor.

## Tek komut

```bash
cd E-TICARET/site
npm run deploy:canli
```

Windows:

```powershell
.\scripts\deploy-canli.ps1
```

veya `deploy-canli.cmd` çift tık.

## Otomatik

`main` dalına merge/push → GitHub Actions **Hetzner deploy** (~3–5 dk).

## Kod klasörü

| Ne | Yol |
|----|-----|
| Düzenle / commit | `E-TICARET/site/` |
| Kullanmayın | `EQUSTO-WORK/E-TICARET/site` (eski kopya) |

## Deploy sonrası

- https://equsto.com/
- **Ctrl+F5**

Detay: [`HETZNER-DEPLOY.md`](HETZNER-DEPLOY.md)
