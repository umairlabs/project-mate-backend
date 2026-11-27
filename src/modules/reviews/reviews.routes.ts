import { Router } from 'express';
import { sendSuccess } from '../../utils/api-response';

export const reviewsRouter = Router();

// Intended endpoints:
// GET /api/reviews/tutor/:id
// POST /api/reviews

reviewsRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'reviews', status: 'initialized' }, 'Reviews module ready');
});
