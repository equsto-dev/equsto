import { PrismaClient } from "@/lib/prisma";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Next.js hot reload — tek bağlantı (Downloads prisma.ts ile aynı desen) */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** PFOS calculator import uyumu */
export const prisma = db;
