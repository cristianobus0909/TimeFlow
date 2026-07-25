import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Folder,
  Calendar,
  DollarSign,
  Settings,
} from 'lucide-react';
import { useTranslation } from '@shared/lib/translations';

export const BottomNav = () => {
  const { t } = useTranslation();

  const navItems = [
    {
      name: t('navDashboard'),
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    { name: t('navTasks'), path: '/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { name: t('navProjects'), path: '/projects', icon: <Folder className="w-4 h-4" /> },
    { name: 'Calendario', path: '/calendar', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Finanzas', path: '/financial', icon: <DollarSign className="w-4 h-4" /> },
    { name: t('navSettings'), path: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <nav className="h-16 bg-zinc-950 border-t border-zinc-900/60 flex items-center justify-around px-2 py-1 select-none z-40">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-brand-purple' : 'text-zinc-500 hover:text-zinc-300'
            }`
          }
        >
          {item.icon}
          <span className="text-[9px] font-bold tracking-tight">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};
export default BottomNav;
