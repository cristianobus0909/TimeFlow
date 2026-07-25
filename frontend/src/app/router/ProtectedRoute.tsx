import { Navigate, Outlet } from 'react-router-dom';
import { authStore } from '@/store/authStore';

export const ProtectedRoute = () => {
  const { isAuthenticated, user } = authStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Paywall guard: If trial has expired and they don't have an active paid subscription, redirect to /pricing
  const isTrialExpired = user?.trialPeriodEnd && new Date() > new Date(user.trialPeriodEnd);
  const isSubscribed = user && ['freelancer', 'pro', 'business'].includes(user.subscriptionPlan) && user.subscriptionStatus === 'active';

  if (isTrialExpired && !isSubscribed) {
    const isSettingsPath = window.location.pathname.startsWith('/settings');
    const isPricingPath = window.location.pathname.startsWith('/pricing');

    if (!isPricingPath && !isSettingsPath) {
      return <Navigate to="/pricing" replace />;
    }
  }

  return <Outlet />;
};
