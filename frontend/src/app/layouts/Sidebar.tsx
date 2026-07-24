import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Folder,
  History,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { authStore } from '@/store/authStore';
import { api } from '@shared/services/api';
import { useTranslation } from '@shared/lib/translations';

export const Sidebar = () => {
  const { user, clearAuth } = authStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuItems = [
    { name: t('navDashboard'), path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, shortcut: '⌥1' },
    { name: t('navTasks'), path: '/tasks', icon: <CheckSquare className="w-4 h-4" />, shortcut: '⌥2' },
    { name: t('navProjects'), path: '/projects', icon: <Folder className="w-4 h-4" />, shortcut: '⌥3' },
    { name: 'Clientes', path: '/clients', icon: <Users className="w-4 h-4" />, shortcut: '⌥7' },
    { name: 'Calendario', path: '/calendar', icon: <Calendar className="w-4 h-4" />, shortcut: '⌥8' },
    { name: 'Finanzas', path: '/financial', icon: <DollarSign className="w-4 h-4" />, shortcut: '⌥9' },
    { name: t('navAnalytics'), path: '/analytics', icon: <BarChart3 className="w-4 h-4" />, shortcut: '⌥5' },
    { name: t('navSettings'), path: '/settings', icon: <Settings className="w-4 h-4" />, shortcut: '⌥6' },
  ];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full flex-shrink-0 select-none">
      {/* Brand Logo */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-zinc-900/60">
        <div className="w-7 h-7 rounded-lg bg-brand-purple flex items-center justify-center shadow-lg shadow-brand-purple/20">
          <Zap className="w-4 h-4 text-white fill-white/10" />
        </div>
        <span className="font-bold text-base text-zinc-100 tracking-tight font-display">
          TimeFlow
        </span>
        {user?.subscriptionPlan === 'pro' && (
          <span className="tf-badge-pro">
            Pro
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-grow py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 border border-transparent'
              }`
            }
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.name}</span>
            </div>
            <span className="text-[10px] text-zinc-700 bg-zinc-950 px-1.5 py-0.5 rounded-md border border-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
              {item.shortcut}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-zinc-900 flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</span>
            <span className="text-[10px] text-zinc-500 truncate">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            title={t('logout')}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
