-- PFOS geri bildirim döngüsü: snapshot meta + feedback + SKU link + fiyat kuralı

ALTER TABLE "PfosTeklifSnapshot" ADD COLUMN "konsept" TEXT;
ALTER TABLE "PfosTeklifSnapshot" ADD COLUMN "referans_id" TEXT;
ALTER TABLE "PfosTeklifSnapshot" ADD COLUMN "referans_liste_key" TEXT;
ALTER TABLE "PfosTeklifSnapshot" ADD COLUMN "m2" INTEGER;
ALTER TABLE "PfosTeklifSnapshot" ADD COLUMN "guven_skoru" DOUBLE PRECISION;
ALTER TABLE "PfosTeklifSnapshot" ADD COLUMN "request_json" JSONB;

CREATE TABLE "pfos_feedback_event" (
    "id" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'wizard',
    "teklif_sayi" TEXT NOT NULL DEFAULT '',
    "snapshot_id" TEXT,
    "konsept" TEXT NOT NULL DEFAULT '',
    "konsept_label" TEXT NOT NULL DEFAULT '',
    "referans_id" TEXT,
    "referans_liste_key" TEXT,
    "m2" INTEGER,
    "guven_skoru" DOUBLE PRECISION,
    "genel_toplam_eur" DECIMAL(14,4),
    "yorum" TEXT,
    "kalem_duzeltmeleri" JSONB,
    "member_logged_in" BOOLEAN NOT NULL DEFAULT false,
    "member_id" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'pending_review',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pfos_feedback_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pfos_sku_link_oneri" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT,
    "link_key" TEXT NOT NULL,
    "liste_key" TEXT NOT NULL,
    "poz" TEXT NOT NULL,
    "eski_sku" TEXT,
    "eski_ad" TEXT,
    "yeni_sku" TEXT NOT NULL DEFAULT '',
    "yeni_ad" TEXT,
    "yeni_marka" TEXT,
    "sorun_tipi" TEXT NOT NULL DEFAULT 'genel',
    "durum" TEXT NOT NULL DEFAULT 'pending',
    "onaylayan" TEXT,
    "onay_notu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "pfos_sku_link_oneri_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pfos_referans_sku_link" (
    "id" TEXT NOT NULL,
    "link_key" TEXT NOT NULL,
    "liste_key" TEXT NOT NULL,
    "poz" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT,
    "marka" TEXT,
    "kaynak" TEXT NOT NULL DEFAULT 'feedback',
    "oneri_id" TEXT,
    "onaylayan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pfos_referans_sku_link_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pfos_fiyat_kurali" (
    "id" TEXT NOT NULL,
    "kapsam" TEXT NOT NULL DEFAULT 'global',
    "konsept_slug" TEXT,
    "liste_key" TEXT,
    "poz" TEXT,
    "urun_tipi" TEXT,
    "isim_kalibi" TEXT,
    "kural_tipi" TEXT NOT NULL,
    "carpan" DOUBLE PRECISION,
    "baz_sku" TEXT,
    "sabit_fiyat_eur" DECIMAL(14,4),
    "aciklama" TEXT,
    "kaynak" TEXT NOT NULL DEFAULT 'feedback',
    "onaylayan" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pfos_fiyat_kurali_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pfos_feedback_event_vote_idx" ON "pfos_feedback_event"("vote");
CREATE INDEX "pfos_feedback_event_durum_idx" ON "pfos_feedback_event"("durum");
CREATE INDEX "pfos_feedback_event_teklif_sayi_idx" ON "pfos_feedback_event"("teklif_sayi");
CREATE INDEX "pfos_feedback_event_konsept_idx" ON "pfos_feedback_event"("konsept");
CREATE INDEX "pfos_feedback_event_created_at_idx" ON "pfos_feedback_event"("created_at");

CREATE INDEX "pfos_sku_link_oneri_durum_idx" ON "pfos_sku_link_oneri"("durum");
CREATE INDEX "pfos_sku_link_oneri_link_key_idx" ON "pfos_sku_link_oneri"("link_key");
CREATE INDEX "pfos_sku_link_oneri_liste_key_poz_idx" ON "pfos_sku_link_oneri"("liste_key", "poz");
CREATE INDEX "pfos_sku_link_oneri_created_at_idx" ON "pfos_sku_link_oneri"("created_at");

CREATE UNIQUE INDEX "pfos_referans_sku_link_link_key_key" ON "pfos_referans_sku_link"("link_key");
CREATE INDEX "pfos_referans_sku_link_liste_key_idx" ON "pfos_referans_sku_link"("liste_key");

CREATE INDEX "pfos_fiyat_kurali_kapsam_konsept_slug_idx" ON "pfos_fiyat_kurali"("kapsam", "konsept_slug");
CREATE INDEX "pfos_fiyat_kurali_liste_key_poz_idx" ON "pfos_fiyat_kurali"("liste_key", "poz");
CREATE INDEX "pfos_fiyat_kurali_urun_tipi_idx" ON "pfos_fiyat_kurali"("urun_tipi");
CREATE INDEX "pfos_fiyat_kurali_aktif_idx" ON "pfos_fiyat_kurali"("aktif");

ALTER TABLE "pfos_feedback_event" ADD CONSTRAINT "pfos_feedback_event_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "PfosTeklifSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pfos_sku_link_oneri" ADD CONSTRAINT "pfos_sku_link_oneri_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "pfos_feedback_event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
