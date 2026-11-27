import { Router } from 'express';
import { sendSuccess } from '../../utils/api-response';

export const reportsRouter = Router();

// Intended endpoints:
// POST /api/reports (Dispute/inappropriate behavior reports)
// GET /api/reports/my-reports

reportsRouter.get('/status', (req, res) => {
  sendSuccess(res, { module: 'reports', status: 'initialized' }, 'Reports module ready');
});
