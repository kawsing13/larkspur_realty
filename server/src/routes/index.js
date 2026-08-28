// Mounts every module router under /api. Every module from the brief is now live.

import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { propertiesRouter } from '../modules/properties/properties.routes.js';
import { propertyTypesRouter, amenitiesRouter } from '../modules/catalog/catalog.routes.js';
import { searchRouter } from '../modules/search/search.routes.js';
import { favoritesRouter } from '../modules/favorites/favorites.routes.js';
import { agentsRouter } from '../modules/agents/agents.routes.js';
import { listingsRouter } from '../modules/listings/listings.routes.js';
import { inquiriesRouter } from '../modules/inquiries/inquiries.routes.js';
import { appointmentsRouter } from '../modules/appointments/appointments.routes.js';
import { documentsRouter } from '../modules/documents/documents.routes.js';
import { notificationsRouter } from '../modules/notifications/notifications.routes.js';
import { reportsRouter } from '../modules/reports/reports.routes.js';
import { savedSearchesRouter } from '../modules/savedSearches/savedSearches.routes.js';
import { auditLogsRouter } from '../modules/auditLogs/auditLogs.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/properties', propertiesRouter); // public read + staff management + brochure PDF
apiRouter.use('/property-types', propertyTypesRouter);
apiRouter.use('/amenities', amenitiesRouter);
apiRouter.use('/search', searchRouter); // public marketplace search (Phase 3)
apiRouter.use('/favorites', favoritesRouter); // customer saved properties (Phase 3)
apiRouter.use('/agents', agentsRouter); // agent directory + profiles (Phase 4)
apiRouter.use('/listings', listingsRouter); // listing approval workflow (Phase 4)
apiRouter.use('/inquiries', inquiriesRouter); // lead CRM (Phase 5)
apiRouter.use('/appointments', appointmentsRouter); // property viewings (Phase 6)
apiRouter.use('/documents', documentsRouter); // access-checked property documents (Phase 7)
apiRouter.use('/notifications', notificationsRouter); // in-app notifications (Phase 7)
apiRouter.use('/reports', reportsRouter); // admin analytics + PDF (Phase 7)
apiRouter.use('/saved-searches', savedSearchesRouter); // customer saved searches (Phase 7)
apiRouter.use('/audit-logs', auditLogsRouter); // authorized activity history (Phase 7)
