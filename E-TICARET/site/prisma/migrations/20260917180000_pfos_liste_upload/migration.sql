-- Üye kaynak listesi (PDF/Excel) — teklife bağlanan orijinal dosya
CREATE TABLE "pfos_liste_upload" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_rel" TEXT NOT NULL,
    "mime" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'pdf',
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "member_id" TEXT,
    "teklif_sayi" TEXT NOT NULL DEFAULT '',
    "snapshot_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pfos_liste_upload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pfos_liste_upload_teklif_sayi_idx" ON "pfos_liste_upload"("teklif_sayi");
CREATE INDEX "pfos_liste_upload_member_id_idx" ON "pfos_liste_upload"("member_id");
CREATE INDEX "pfos_liste_upload_created_at_idx" ON "pfos_liste_upload"("created_at");
