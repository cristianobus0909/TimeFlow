import { Router } from 'express';

// Import Module Routes
import authRoutes from '@modules/auth/auth.routes';
import billingRoutes from '@modules/billing/billing.routes';
import taskRoutes from '@modules/tasks/task.routes';
import projectRoutes from '@modules/projects/project.routes';
import sessionRoutes from '@modules/timer/timer.routes';
import settingsRoutes from '@modules/settings/settings.routes';
import analyticsRoutes from '@modules/analytics/analytics.routes';
import organizationRoutes from '@modules/organizations/organization.routes';
import clientRoutes from '@modules/clients/client.routes';
import rateRoutes from '@modules/rates/rate.routes';
import workSessionRoutes from '@modules/workSessions/work-session.routes';
import dashboardRoutes from '@modules/dashboard/dashboard.routes';
import focusRoutes from '@modules/focus/focus.routes';
import commentRoutes from '@modules/comments/comment.routes';
import attachmentRoutes from '@modules/attachments/attachment.routes';
import timelineRoutes from '@modules/timeline/timeline.routes';
import searchRoutes from '@modules/search/search.routes';
import financialRoutes from '@modules/financial/financial.routes';
import aiRoutes from '@modules/ai/ai.routes';

// Import Security & Paywall Middlewares
import { authenticateToken } from '@core/middleware/auth.middleware';
import { checkPaywall } from '@core/middleware/paywall.middleware';

const apiRouter = Router();

// Unauthenticated / Public Module Routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/billing', billingRoutes);

// Protected Business Module Routes (Authentication & Paywall Enforcement)
apiRouter.use(authenticateToken as any);
apiRouter.use(checkPaywall as any);

apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/sessions', sessionRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/organizations', organizationRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/rates', rateRoutes);
apiRouter.use('/work-sessions', workSessionRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/focus', focusRoutes);
apiRouter.use('/comments', commentRoutes);
apiRouter.use('/attachments', attachmentRoutes);
apiRouter.use('/timeline', timelineRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/financial', financialRoutes);
apiRouter.use('/ai', aiRoutes);

export default apiRouter;
