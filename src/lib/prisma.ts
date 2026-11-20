import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Database connection is not configured");
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString,
        max: 3,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      }),
    });
  }
  return globalForPrisma.prisma;
}
