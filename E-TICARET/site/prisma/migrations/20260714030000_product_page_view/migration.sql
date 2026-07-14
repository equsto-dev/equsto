-- Ürün sayfası süre takibi (kullanıcı raporu)
CREATE TABLE "product_page_view" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "product_id" TEXT,
    "slug" TEXT NOT NULL,
    "dept" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "brand" TEXT NOT NULL DEFAULT '',
    "duration_ms" INTEGER NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'tr',
    "member_id" TEXT,
    "referrer" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_page_view_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_page_view_created_at_idx" ON "product_page_view"("created_at");
CREATE INDEX "product_page_view_slug_created_at_idx" ON "product_page_view"("slug", "created_at");
CREATE INDEX "product_page_view_product_id_created_at_idx" ON "product_page_view"("product_id", "created_at");
CREATE INDEX "product_page_view_session_id_created_at_idx" ON "product_page_view"("session_id", "created_at");
CREATE INDEX "product_page_view_dept_created_at_idx" ON "product_page_view"("dept", "created_at");
