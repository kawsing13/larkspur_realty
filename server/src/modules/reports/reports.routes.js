import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './reports.service.js';

export const reportsRouter = Router();

// Reporting is an administrator / property-manager function.
reportsRouter.use(authenticate, authorize('report:read'));

reportsRouter.get(
  '/overview',
  asyncHandler(async (req, res) => res.json(await service.overview())),
);

reportsRouter.get(
  '/agents',
  asyncHandler(async (req, res) => res.json({ data: await service.agentPerformance() })),
);

reportsRouter.get(
  '/summary.pdf',
  asyncHandler(async (req, res) => {
    const pdf = await service.summaryPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="operations-summary.pdf"');
    res.send(pdf);
  }),
);
