# Vercel’e Meilisearch env ekleme (adım adım)

Bu makineden Vercel hesabınıza **doğrudan giriş yapamıyoruz** — değişkenleri siz panelden eklemeniz gerekir. Aşağıdaki adımlar yeterli (5 dakika).

## 1) Vercel’e girin

1. Tarayıcıda açın: **https://vercel.com/dashboard**
2. Giriş yapın (GitHub ile bağlıysanız aynı hesap).
3. Projeye tıklayın: **equsto** (veya repoyu deploy ettiğiniz proje adı).

## 2) Environment Variables sayfası

1. Üst menüden **Settings** (Ayarlar).
2. Sol menüden **Environment Variables** (Ortam değişkenleri).

## 3) Üç değişken ekleyin

Her biri için **Add New** → **Key** / **Value** doldurun.

**Önemli:** Value kutusuna **tırnak koymayın** (`"` veya `'` yok).

| Key | Value (nereden) |
|-----|-----------------|
| `MEILISEARCH_HOST` | `equsto-v2/.env.local` dosyasındaki satır — **tek** `https://` ile başlamalı |
| `MEILISEARCH_MASTER_KEY` | Aynı dosyada Admin API key |
| `MEILISEARCH_INDEX` | `equsto_products` |

**Environments:** Her üçü için işaretleyin:

- Production
- Preview  
- (Development isteğe bağlı)

**Save** / **Add** ile kaydedin.

### Host örneği (sizinki farklı olabilir)

```
https://ms-f0fc0b55f378-48423.fra.meilisearch.io
```

Yanlış (çift https):

```
https://https://ms-....
```

## 4) Yeniden deploy

Env eklemek tek başına yetmez; build’e işlenmesi için:

1. Üstten **Deployments**
2. En üstteki (Production) satır → sağdaki **⋯** (üç nokta)
3. **Redeploy**
4. **Redeploy** onaylayın (Production seçili kalsın)

2–3 dakika bekleyin.

## 5) Canlı test

Tarayıcıda:

- https://equsto.com/api/search?q=izgara  
  → JSON içinde `hits` dizisi dolu olmalı.

Hata:

- `Meilisearch yapılandırılmadı` → env eksik veya redeploy yapılmadı.
- Boş `hits` → indeks boş; yerelde `npm run search:index` tekrar (Cloud’a zaten 9452 belge yüklü).

## Değerleri nereden kopyalarım?

`C:\D Disk\EQUSTO-CURSOR\equsto-v2\.env.local` dosyasını Notepad ile açın:

```env
MEILISEARCH_HOST=https://ms-....fra.meilisearch.io
MEILISEARCH_MASTER_KEY=....uzun-anahtar....
MEILISEARCH_INDEX=equsto_products
```

Bu üç satırı Vercel’deki üç Key ile eşleştirin.

## İleride: CLI (isteğe bağlı)

```cmd
npm i -g vercel
cd equsto-v2
vercel login
vercel link
```

### `vercel env pull` uyarısı

- **Sensitive** değişkenler (`MEILISEARCH_*`, `DATABASE_URL`, …) CLI ile **indirilmez** — `.env.local` içinde `""` boş satır yazar.
- **Overwrite = yes** derseniz elinizdeki dolu `.env.local` silinmiş gibi görünür; Vercel panelindeki değerler **durur**.
- Yerel için: `.env` yedekten kopyalayın veya panelden **Reveal** ile tek tek yapıştırın.
- `env pull` ile **Development** değil, gerekirse `--environment=production` kullanın; yine de Meili anahtarı elle gelir.

`env pull` zorunlu değil.
