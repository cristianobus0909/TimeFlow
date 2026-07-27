import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Route Guards & Shell Layout
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '@app/layouts/AppLayout';

// Lazy-Loaded Page Components for Code-Splitting & Performance
const LandingPage = lazy(() => import('@modules/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@modules/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@modules/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const CommandCenterPage = lazy(() => import('@modules/command-center/pages/CommandCenterPage').then(m => ({ default: m.CommandCenterPage })));
const TasksPage = lazy(() => import('@modules/tasks/TasksPage').then(m => ({ default: m.TasksPage })));
const ProjectsPage = lazy(() => import('@modules/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@modules/projects/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const HistoryPage = lazy(() => import('@modules/history/HistoryPage').then(m => ({ default: m.HistoryPage })));
const AnalyticsPage = lazy(() => import('@modules/reports/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@modules/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const FocusPage = lazy(() => import('@modules/focus/pages/FocusPage').then(m => ({ default: m.FocusPage })));
const ClientsPage = lazy(() => import('@modules/clients/pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import('@modules/clients/pages/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));
const CalendarPage = lazy(() => import('@modules/calendar/pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const FinancialDashboardPage = lazy(() => import('@modules/financial/pages/FinancialDashboardPage').then(m => ({ default: m.FinancialDashboardPage })));
const InvoiceManagerPage = lazy(() => import('@modules/financial/pages/InvoiceManagerPage').then(m => ({ default: m.InvoiceManagerPage })));
const ExpenseManagerPage = lazy(() => import('@modules/financial/pages/ExpenseManagerPage').then(m => ({ default: m.ExpenseManagerPage })));
const AIDashboardPage = lazy(() => import('@modules/ai-dashboard/pages/AIDashboardPage').then(m => ({ default: m.AIDashboardPage })));

// Suspense Fallback Loader
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-zinc-400 gap-3 select-none">
    <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-zinc-500">Cargando vista...</span>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Neutral Views (Accessible to both guests and logged-in users) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<LandingPage />} />

        {/* Public Views (Guests only - authenticated users get redirected to dashboard) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Private App Views (Auth required) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<CommandCenterPage />} />
            <Route path="/ai" element={<AIDashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/financial" element={<FinancialDashboardPage />} />
            <Route path="/invoices" element={<InvoiceManagerPage />} />
            <Route path="/expenses" element={<ExpenseManagerPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/focus" element={<FocusPage />} />
          </Route>
        </Route>

        {/* Catch-all fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
export default AppRouter;
