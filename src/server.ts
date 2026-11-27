import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';

async function bootstrap(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 Project Mate API running at http://localhost:${env.port}`);
    console.log(`📡 Health-check: http://localhost:${env.port}/api/health`);
    console.log(`🌍 Environment: ${env.nodeEnv}`);
    console.log(`===============================================`);
  });

  // Connect to database in the background (non-blocking for health check)
  connectDatabase().catch((err) => {
    console.warn('[Database] Background connection attempt encountered an issue:', err);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force close if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Server] Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('[Fatal] Error bootstrapping Project Mate server:', error);
  process.exit(1);
});
