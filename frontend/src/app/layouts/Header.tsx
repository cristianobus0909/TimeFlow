import { Sun, Moon, Search, Maximize2 } from 'lucide-react';
import { themeStore } from '@/store/themeStore';
import { TimerWidget } from '@modules/timer/TimerWidget';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onSearchClick: () => void;
}

export const Header = ({ onSearchClick }: HeaderProps) => {
  const { theme, toggleTheme } = themeStore();
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-zinc-200/60 dark:border-zinc-900/60 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Search Command Palette Shortcut */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-3 py-1.5 rounded-xl text-xs font-medium w-64 text-left transition-all select-none cursor-pointer"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-grow">Buscar o ejecutar...</span>
        <span className="bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 px-1.5 py-0.5 rounded font-mono text-[9px] text-zinc-500 dark:text-zinc-600">
          ⌘K
        </span>
      </button>

      {/* Center Sticky Timer Widget */}
      <TimerWidget />

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Focus Mode button */}
        <button
          onClick={() => navigate('/focus')}
          className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-pointer flex items-center justify-center"
          title="Modo Focus"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-pointer"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
export default Header;
