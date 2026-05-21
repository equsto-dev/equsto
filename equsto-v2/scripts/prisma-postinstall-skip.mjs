/**
 * npm install sonrası node_modules\.prisma\client yazımını tetiklemez (Windows EPERM).
 * Client üretimi: npm run db:generate  →  prisma/generated/client
 */
console.log(
  "[equsto] Prisma: postinstall generate kapalı. İlk kurulum / şema değişince: npm run db:generate"
);
