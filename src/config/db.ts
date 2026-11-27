import { PrismaClient } from '@prisma/client';

// Prisma Client Singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

let isConnected = false;

/**
 * Connect to PostgreSQL database via Prisma
 */
export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    isConnected = true;
    console.log('[Database] PostgreSQL connection established successfully via Prisma');
    return true;
  } catch (error) {
    isConnected = false;
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Database] PostgreSQL connection failed (${msg}). Server continues in degraded mode.`);
    return false;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected;
}

/**
 * Disconnect from PostgreSQL database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    isConnected = false;
    console.log('[Database] PostgreSQL connection closed');
  } catch (error) {
    console.error('[Database] Error disconnecting:', error);
  }
}

/**
 * Health check - ping database
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
