import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Route Guards & Shell Layout
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AppLayout } from '@app/layouts/AppLayout';

// Import Page Components
import { LandingPage } from '@modules/landing/LandingPage';
import { LoginPage } from '@modules/auth/LoginPage';
import { RegisterPage } from '@modules/auth/RegisterPage';
import { CommandCenterPage } from '@modules/command-center/pages/CommandCenterPage';
import { TasksPage } from '@modules/tasks/TasksPage';
import { ProjectsPage } from '@modules/projects/ProjectsPage';
import { ProjectDetailPage } from '@modules/projects/ProjectDetailPage';
import { HistoryPage } from '@modules/history/HistoryPage';
import { AnalyticsPage } from '@modules/reports/AnalyticsPage';
import { SettingsPage } from '@modules/settings/SettingsPage';
import { FocusPage } from '@modules/focus/pages/FocusPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Views (Guest only) */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Private App Views (Auth required) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<CommandCenterPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/focus" element={<FocusPage />} />
        </Route>
      </Route>

      {/* Catch-all fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default AppRouter;
