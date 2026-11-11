# Misafir admin Bearer (1 gün)

Ajans / yazılımcıya **geçici** panel erişimi. Senin `EQUSTO_ADMIN_BEARER` değişmez.

## Ön koşul

Canlıda misafir desteği deploy edilmiş olmalı (`lib/auth.ts` — `EQUSTO_ADMIN_BEARER_GUEST`).

## Ver (24 saat)

```bash
cd E-TICARET/site
npm run admin:guest:issue
```

Çıktıdaki token’ı ajansa ver. Panel: `https://equsto.com/pro`

Farklı süre: `node scripts/issue-admin-guest-bearer.mjs --issue --hours=48`

## Erken iptal

```bash
npm run admin:guest:revoke
```

Süre dolunca da token kendiliğinden 401 olur (EXPIRES).

## Not

- Misafir token de tam yönetim yetkisi verir (istatistik + yazma).
- Token’ı chat/mail’de uzun süre bırakma; iş bitince revoke.
