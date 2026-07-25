import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { User } from '@modules/users/user.model';

export const checkPaywall = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || !req.user.userId) {
    return next();
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return next();
    }

    const isTrialExpired =
      user.subscriptionStatus === 'trialing' &&
      user.trialPeriodEnd &&
      new Date() > new Date(user.trialPeriodEnd);

    // If the 7-day trial period ends and they have not paid, transition them to the Free tier automatically
    if (isTrialExpired) {
      user.subscriptionPlan = 'free';
      user.subscriptionStatus = 'free';
      await user.save();
      console.log(`ℹ️ Usuario ${user._id} degradado automáticamente al plan Free al finalizar el trial.`);
    }

    next();
  } catch (error) {
    next(error);
  }
};
