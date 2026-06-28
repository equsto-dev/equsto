-- PFOS kullanım istatistiği (anonim teklif üretimi + gönderim)
CREATE TABLE "pfos_usage_event" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "konsept_label" TEXT NOT NULL DEFAULT '',
    "konsept" TEXT NOT NULL DEFAULT '',
    "m2" INTEGER,
    "teklif_sayi" TEXT NOT NULL DEFAULT '',
    "teklif_ref" TEXT NOT NULL DEFAULT '',
    "kalem_sayisi" INTEGER NOT NULL DEFAULT 0,
    "toplam_try" DECIMAL(14,2),
    "toplam_eur" DECIMAL(14,4),
    "sehir" TEXT NOT NULL DEFAULT '',
    "member_logged_in" BOOLEAN NOT NULL DEFAULT false,
    "member_id" TEXT,
    "gonderim_kanal" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pfos_usage_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pfos_usage_event_event_idx" ON "pfos_usage_event"("event");
CREATE INDEX "pfos_usage_event_source_idx" ON "pfos_usage_event"("source");
CREATE INDEX "pfos_usage_event_created_at_idx" ON "pfos_usage_event"("created_at");
CREATE INDEX "pfos_usage_event_teklif_sayi_idx" ON "pfos_usage_event"("teklif_sayi");
