import { Router } from 'express';
import { sendSuccess } from '../../utils/api-response';

export const paymentsRouter = Router();

// Intended endpoints:
// GET /api/payments/escrow
// POST /api/payments/deposit
// POST /api/payments/release
// POST /api/payments/refund

paymentsRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'payments', status: 'initialized' }, 'Payments module ready');
});
