-- ShopMember / ShopMemberSession — şema db push ile canlıya alınmıştı; migrate dev shadow DB için baseline.
CREATE TABLE IF NOT EXISTS "ShopMember" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL DEFAULT 'email',
    "picture" TEXT,
    "cartItems" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShopMember_email_key" ON "ShopMember"("email");

CREATE TABLE IF NOT EXISTS "ShopMemberSession" (
    "token" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopMemberSession_pkey" PRIMARY KEY ("token")
);

CREATE INDEX IF NOT EXISTS "ShopMemberSession_memberId_idx" ON "ShopMemberSession"("memberId");
CREATE INDEX IF NOT EXISTS "ShopMemberSession_expiresAt_idx" ON "ShopMemberSession"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ShopMemberSession_memberId_fkey'
  ) THEN
    ALTER TABLE "ShopMemberSession"
      ADD CONSTRAINT "ShopMemberSession_memberId_fkey"
      FOREIGN KEY ("memberId") REFERENCES "ShopMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
