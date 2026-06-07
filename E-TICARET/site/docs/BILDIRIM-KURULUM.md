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

Hesap: **jurnaldang@gmail.com** (Resend kayıt e-postası)

1. [resend.com](https://resend.com) → API Key
2. Vercel (Production):

```
RESEND_API_KEY=re_...
RESEND_FROM=Equsto <onboarding@resend.dev>
RESEND_ACCOUNT_EMAIL=jurnaldang@gmail.com
EQUSTO_NOTIFY_EMAIL=jurnaldang@gmail.com
```

### PFOS teklif PDF — önemli kural

| Aşama | `RESEND_FROM` | Kime gider? |
|--------|----------------|-------------|
| **Test (şimdi)** | `Equsto <onboarding@resend.dev>` | Yalnızca **jurnaldang@gmail.com** |
| **Canlı (müşteri)** | `Equsto <notify@equsto.com>` | Herhangi bir müşteri e-postası |

`onboarding@resend.dev` ile **ademakpinar@outlook.com** veya başka adreslere mail **gitmez** (Resend sandbox kuralı). Test için PFOS formunda e-posta alanına **jurnaldang@gmail.com** yazın.

### Kalıcı çözüm — equsto.com domain (Adım 1)

1. [resend.com/domains](https://resend.com/domains) → **Add Domain** → `equsto.com`
2. Resend’in verdiği **DNS kayıtlarını** (SPF, DKIM) domain sağlayıcınıza ekleyin (Vercel DNS veya domain paneli)
3. Resend’de domain **Verified** olunca Vercel’de güncelleyin:

```
RESEND_FROM=Equsto <notify@equsto.com>
```

4. **Redeploy**

Bundan sonra PFOS’tan her müşteri e-postasına PDF gider.

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
