import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Compass, Play, Pause, Sun, Moon, LogOut } from 'lucide-react';
import { api } from '../services/api';
import { themeStore } from '../store/themeStore';
import { timerStore } from '../store/timerStore';
import { authStore } from '../store/authStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navegación' | 'Acciones' | 'Tareas' | 'Proyectos';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { toggleTheme } = themeStore();
  const { isRunning, startTimer, pauseTimer, resumeTimer } = timerStore();
  const { clearAuth } = authStore();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
      fetchQuickSearchData();
    }
  }, [isOpen]);

  const fetchQuickSearchData = async () => {
    try {
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        api.get('/tasks?status=active'),
        api.get('/projects?status=in_progress'),
      ]);
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
    } catch (e) {
      console.error('Failed to fetch command palette data:', e);
    }
  };

  // Base navigation commands
  const defaultCommands: CommandItem[] = [
    {
      id: 'nav-dash',
      title: 'Ir a Dashboard',
      category: 'Navegación',
      icon: <Compass className="w-4 h-4" />,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-tasks',
      title: 'Ir a Tareas',
      category: 'Navegación',
      icon: <Compass className="w-4 h-4" />,
      action: () => navigate('/tasks'),
    },
    {
      id: 'nav-projects',
      title: 'Ir a Proyectos',
      category: 'Navegación',
      icon: <Compass className="w-4 h-4" />,
      action: () => navigate('/projects'),
    },
    {
      id: 'nav-history',
      title: 'Ir a Historial',
      category: 'Navegación',
      icon: <Compass className="w-4 h-4" />,
      action: () => navigate('/history'),
    },
    {
      id: 'nav-settings',
      title: 'Ir a Configuración',
      category: 'Navegación',
      icon: <Compass className="w-4 h-4" />,
      action: () => navigate('/settings'),
    },
    {
      id: 'action-theme',
      title: 'Cambiar Modo de Color (Claro/Oscuro)',
      category: 'Acciones',
      icon: <Sun className="w-4 h-4" />,
      action: () => toggleTheme(),
    },
    {
      id: 'action-logout',
      title: 'Cerrar Sesión',
      category: 'Acciones',
      icon: <LogOut className="w-4 h-4" />,
      action: () => {
        clearAuth();
        navigate('/login');
      },
    },
  ];

  // Dynamic start actions for tasks
  const taskCommands: CommandItem[] = tasks.map((t) => ({
    id: `task-${t._id}`,
    title: `Iniciar cronómetro: ${t.name}`,
    category: 'Tareas',
    icon: <Play className="w-4 h-4 text-brand-purple" />,
    action: () => startTimer(t._id, null, t.name, t.color),
  }));

  // Dynamic project navigation
  const projectCommands: CommandItem[] = projects.map((p) => ({
    id: `proj-${p._id}`,
    title: `Ir a proyecto: ${p.name}`,
    category: 'Proyectos',
    icon: <Compass className="w-4 h-4 text-emerald-400" />,
    action: () => navigate(`/projects/${p._id}`),
  }));

  const allCommands = [...defaultCommands, ...taskCommands, ...projectCommands];

  const filteredCommands = allCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -5, transition: { duration: 0.15 } }}
            className="relative bg-zinc-950 border border-zinc-900 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[50vh]"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-900">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un comando o busca una tarea..."
                className="w-full bg-transparent border-none text-zinc-200 outline-none placeholder:text-zinc-600 text-sm py-1"
              />
            </div>

            {/* Commands List */}
            <div className="overflow-y-auto flex-grow p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No se encontraron resultados para "{search}"
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredCommands.map((cmd, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left w-full transition-all text-xs font-medium cursor-pointer ${
                          isSelected
                            ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/10'
                            : 'text-zinc-400 hover:bg-zinc-900/50'
                        }`}
                      >
                        <span className={isSelected ? 'text-white' : 'text-zinc-500'}>
                          {cmd.icon}
                        </span>
                        <span className="flex-grow truncate">{cmd.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                            isSelected
                              ? 'bg-brand-purple-hover text-zinc-100'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-900'
                          }`}
                        >
                          {cmd.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Cues */}
            <div className="px-4 py-2 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[10px] text-zinc-600">
              <div className="flex items-center gap-3">
                <span>↑↓ para navegar</span>
                <span>↵ para seleccionar</span>
              </div>
              <span>ESC para salir</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
