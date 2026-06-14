-- CreateTable
CREATE TABLE "ShopMemberPasswordReset" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopMemberPasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopMemberPasswordReset_memberId_idx" ON "ShopMemberPasswordReset"("memberId");

-- CreateIndex
CREATE INDEX "ShopMemberPasswordReset_expiresAt_idx" ON "ShopMemberPasswordReset"("expiresAt");

-- AddForeignKey
ALTER TABLE "ShopMemberPasswordReset" ADD CONSTRAINT "ShopMemberPasswordReset_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ShopMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
