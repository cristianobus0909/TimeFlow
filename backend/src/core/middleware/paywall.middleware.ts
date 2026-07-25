import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { User } from '@modules/users/user.model';

export const checkPaywall = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // If not authenticated, let auth.middleware handle it
  if (!req.user || !req.user.userId) {
    return next();
  }

  // Bypass paywall for billing, auth, and profile settings/logout endpoints
  const path = req.originalUrl || req.baseUrl || req.path || '';
  if (
    path.includes('/billing') ||
    path.includes('/auth') ||
    path.includes('/settings') ||
    path.includes('/organizations/me')
  ) {
    return next();
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return next();
    }

    const hasPaidPlan =
      ['freelancer', 'pro', 'business'].includes(user.subscriptionPlan) &&
      user.subscriptionStatus === 'active';
    const isTrialing =
      user.subscriptionStatus === 'trialing' &&
      user.trialPeriodEnd &&
      new Date() < new Date(user.trialPeriodEnd);

    // If trial is expired and they haven't paid, block!
    if (!hasPaidPlan && !isTrialing) {
      res.status(402).json({
        error: 'Suscripción requerida.',
        code: 'PAYMENT_REQUIRED',
        message: 'Tu período de prueba de 7 días ha finalizado. Por favor, selecciona una suscripción para continuar.',
        trialExpired: true,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
