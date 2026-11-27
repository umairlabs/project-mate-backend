import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { isDatabaseConnected } from './config/db';
import { sendSuccess } from './utils/api-response';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

// Route modules
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { tutorListingsRouter } from './modules/tutor-listings/tutor-listings.routes';
import { subjectsRouter } from './modules/subjects/subjects.routes';
import { helpRequestsRouter } from './modules/help-requests/help-requests.routes';
import { negotiationsRouter } from './modules/negotiations/negotiations.routes';
import { connectionsRouter } from './modules/connections/connections.routes';
import { reviewsRouter } from './modules/reviews/reviews.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { adminRouter } from './modules/admin/admin.routes';

export function createApp(): Express {
  const app = express();

  // Security & HTTP headers
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );

  // Request logger
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.logLevel));
  }

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root welcome route
  app.get('/', (req, res) => {
    sendSuccess(res, {
      service: 'Project Mate API',
      version: '1.0.0',
      status: 'active'
    }, 'Project Mate Backend Service is online');
  });

  // Health-check endpoint: GET /api/health
  app.get('/api/health', (req, res) => {
    const dbConnected = isDatabaseConnected();
    sendSuccess(
      res,
      {
        status: dbConnected ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.nodeEnv,
        database: {
          connected: dbConnected,
          status: dbConnected ? 'connected' : 'disconnected/standby'
        }
      },
      dbConnected ? 'All systems operational' : 'API active; Database disconnected'
    );
  });

  // Mount API modules
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/tutor-listings', tutorListingsRouter);
  app.use('/api/subjects', subjectsRouter);
  app.use('/api/help-requests', helpRequestsRouter);
  app.use('/api/negotiations', negotiationsRouter);
  app.use('/api/connections', connectionsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/admin', adminRouter);

  // Fallback 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized application error handler
  app.use(errorHandler);

  return app;
}
