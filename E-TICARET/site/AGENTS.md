<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Canlı deploy (zorunlu)

Görevi bitirince kullanıcı “canlıya al” demesini **bekleme**.

- Kod değiştiyse: `main` push + Hetzner deploy (`npm run deploy:canli` veya push workflow’unu izle).
- Secret/env (Gemini, Anthropic, WhatsApp…): ilgili `push-*-env-hetzner.mjs` + container restart; canlıda doğrula.
- Cevapta canlıya alındığını belirt. “Yapıldı, deploy ister misin?” sorma.
