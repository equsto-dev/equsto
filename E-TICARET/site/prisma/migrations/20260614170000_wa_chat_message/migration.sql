-- CreateTable
CREATE TABLE "wa_chat_message" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "wa_message_id" TEXT,
    "member_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wa_chat_message_wa_message_id_key" ON "wa_chat_message"("wa_message_id");

-- CreateIndex
CREATE INDEX "wa_chat_message_phone_created_at_idx" ON "wa_chat_message"("phone", "created_at");
