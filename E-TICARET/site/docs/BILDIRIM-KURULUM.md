# Anlık bildirim — kedi sohbet & sipariş

Site içi **Mr. Equsto** sohbetinden veya **yeni sipariş**ten sonra telefona/e-postaya uyarı.

Desteklenen kanallar (en az **biri** yeterli):

| Kanal | Telefona | Kurulum |
|--------|----------|---------|
| **Telegram** (önerilen) | Uygulama bildirimi | ~5 dk, ücretsiz |
| **E-posta** (Resend) | Gmail push vb. | Resend hesabı |
| **SMS** (Twilio) | SMS | Twilio + ücretli |

---

## 1) Telegram (önerilen)

1. Telegram → **@BotFather** → `/newbot` → bot adı verin → **token** kopyalayın
2. Botunuzla sohbet açın → `/start` yazın
3. Tarayıcıda (token yerine yapıştırın):
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. `"chat":{"id":123456789` → bu **chat id**

**Vercel → Environment Variables:**

```
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=123456789
```

---

## 2) E-posta (Resend)

1. [resend.com](https://resend.com) → API Key
2. Vercel:

```
RESEND_API_KEY=re_...
EQUSTO_NOTIFY_EMAIL=sizin@gmail.com
RESEND_FROM=Equsto <notify@equsto.com>
```

(`RESEND_FROM` domain doğrulanana kadar `onboarding@resend.dev` kullanılabilir.)

---

## 3) SMS (Twilio, opsiyonel)

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+1...
EQUSTO_NOTIFY_SMS_E164=905326840152
```

---

## Test

Deploy sonrası (Bearer = `.env.local` → `EQUSTO_ADMIN_BEARER`):

```powershell
$h = @{ Authorization = "Bearer eq_adm_..." }
Invoke-RestMethod -Uri "https://equsto.com/api/notify/test" -Method POST -Headers $h
```

Yanıt: `"sent": ["telegram"]` → telefona test mesajı gelmeli.

---

## Ne zaman tetiklenir?

- `POST /api/musteriler` — kedi sohbet, iletişim formu
- Yeni sipariş — `POST /api/siparisler`

Panel: https://equsto.com/yonetim/isletme

---

## WhatsApp Business API

Gerçek WhatsApp **giden** mesajı (Meta şablon onayı) ayrı entegrasyon gerektirir.
Bu dokümandaki kanallar **sizin telefonunuza uyarı** içindir; ziyaretçi yine site içi kedide konuşur.
