import { PrismaClient } from '@prisma/client';

// Next.js dev mode reloads modules on every file change, which would otherwise
// create a new PrismaClient (and a new DB connection pool) on every request.
// Caching the client on `globalThis` avoids that in development while staying
// a plain singleton in production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
