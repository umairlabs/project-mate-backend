import { Router } from 'express';
import { sendSuccess } from '../../utils/api-response';

export const negotiationsRouter = Router();

// Intended endpoints:
// GET /api/negotiations
// POST /api/negotiations
// PATCH /api/negotiations/:id/accept
// PATCH /api/negotiations/:id/counter
// PATCH /api/negotiations/:id/reject

negotiationsRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'negotiations', status: 'initialized' }, 'Negotiations module ready');
});
