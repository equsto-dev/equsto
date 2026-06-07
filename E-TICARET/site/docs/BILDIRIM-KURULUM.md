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

## 4) PFOS teklif PDF — WhatsApp

### Yol haritası (Equsto kararı)

| Aşama | Sağlayıcı | Amaç |
|--------|-----------|------|
| **Test / şimdi** | **Green API** (`EQUSTO_WHATSAPP_MODE=green-api`) | Hızlı kurulum, QR ile PDF gönderimi |
| **Temelli / canlı** | **Meta Cloud API** (`EQUSTO_WHATSAPP_MODE=meta`) | Resmi WhatsApp, şablon onayı, ölçeklenebilir |

Kod her iki modu destekler; Vercel’de `EQUSTO_WHATSAPP_MODE` değiştirerek geçiş yapılır.

---

### Green API — test kurulumu

PFOS’ta **WhatsApp'ıma gönder (PDF)** için sunucu tarafı gönderim gerekir. **Green API** ile QR kod tarayarak bağlanırsınız; Facebook hesabı gerekmez.

### Adım 1 — Green API hesabı

1. [green-api.com](https://green-api.com) → **Sign up** (ücretsiz deneme var)
2. Giriş yapın → **Console** (kontrol paneli)

### Adım 2 — Instance oluştur + QR tara

1. **Create instance** (veya yeni örnek oluştur)
2. Açılan **QR kodu**, teklif gönderecek **iş WhatsApp numaranızla** tarayın (telefon → WhatsApp → Bağlı cihazlar → Cihaz bağla)
3. Durum **authorized** olmalı

### Adım 3 — Kimlik bilgilerini kopyala

Panelde instance satırında:

| Alan | Vercel değişkeni |
|------|------------------|
| **idInstance** | `GREEN_API_INSTANCE_ID` |
| **apiTokenInstance** | `GREEN_API_TOKEN` |

### Adım 4 — Vercel ortam değişkenleri

Vercel → proje → **Settings** → **Environment Variables** → **Production**:

```
EQUSTO_WHATSAPP_MODE=green-api
GREEN_API_INSTANCE_ID=1101234567
GREEN_API_TOKEN=abc123...
```

**Redeploy** (Deployments → son deploy → ⋮ → Redeploy).

### Adım 5 — Test

1. [equsto.com/pfos](https://equsto.com/pfos) → teklif oluştur
2. Telefon alanına **WhatsApp’ınızın numarası** (ör. `0532…` veya `90532…`)
3. **WhatsApp'ıma gönder (PDF)** → birkaç saniye içinde PDF gelmeli

Hata: *«WhatsApp sunucu gönderimi yapılandırılmamış»* → `EQUSTO_WHATSAPP_MODE=green-api` veya Green API anahtarları eksik / redeploy yapılmamış.

---

## WhatsApp Business API (Meta) — hedef platform

Meta Cloud API (Facebook Developer, şablon onayı) **canlı hedef** moddur: `EQUSTO_WHATSAPP_MODE=meta`.

Geçişte Vercel’de:
- `EQUSTO_WHATSAPP_MODE=meta`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, … (Meta Developer panel)

Green API test aşamasında kalır; Meta geçişi ayrı iş paketi (Business doğrulama + şablon onayı).
