-- PFOS üye ürün gezinme — Faz C kişiselleştirme
CREATE TABLE "pfos_member_browse_event" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "product_id" TEXT,
    "slug" TEXT NOT NULL,
    "tip_kodu" TEXT,
    "konsept_label" TEXT NOT NULL DEFAULT '',
    "dukkan_turu" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'pdp',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pfos_member_browse_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pfos_member_browse_event_member_id_created_at_idx" ON "pfos_member_browse_event"("member_id", "created_at");
CREATE INDEX "pfos_member_browse_event_member_id_konsept_label_idx" ON "pfos_member_browse_event"("member_id", "konsept_label");
CREATE INDEX "pfos_member_browse_event_member_id_dukkan_turu_idx" ON "pfos_member_browse_event"("member_id", "dukkan_turu");
CREATE INDEX "pfos_member_browse_event_member_id_slug_idx" ON "pfos_member_browse_event"("member_id", "slug");
