import { Sun, Moon, Search, Play, Pause, Square, Clock, Minimize2 } from 'lucide-react';
import { themeStore } from '../../store/themeStore';
import { timerStore } from '../../store/timerStore';
import { toastStore } from '../../store/toastStore';
import { api } from '../../services/api';

interface HeaderProps {
  onSearchClick: () => void;
}

export const Header = ({ onSearchClick }: HeaderProps) => {
  const { theme, toggleTheme } = themeStore();
  const {
    activeTaskName,
    activeTaskColor,
    isRunning,
    isPaused,
    seconds,
    tick,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setCompact,
    setAutoStart,
  } = timerStore();
  const { showToast } = toastStore();

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  const handleStop = async () => {
    const currentTaskId = timerStore.getState().activeTaskId;
    const currentProjectId = timerStore.getState().activeProjectId;
    const currentProjectTaskId = timerStore.getState().activeProjectTaskId;

    const timerData = stopTimer();
    if (!timerData) return;

    try {
      // 1. Log the session
      await api.post('/sessions', {
        taskId: currentTaskId,
        projectId: currentProjectId,
        startTime: timerData.startTime,
        endTime: timerData.endTime,
        duration: timerData.duration,
        breaks: timerData.breaks,
        device: 'desktop',
      });
      showToast('Sesión guardada con éxito.');
      
      // 2. Mark the project task as completed (if run in project context)
      if (currentProjectId && currentProjectTaskId) {
        try {
          await api.put(`/projects/${currentProjectId}/tasks/${currentProjectTaskId}/status`, {
            status: 'completed',
          });
        } catch (err) {
          console.error('Failed to mark task as completed:', err);
        }
      }

      // Notify parent pages to reload their React Query cache
      window.dispatchEvent(new CustomEvent('session-logged'));

      // 3. Check if project has a next pending task to transition to
      if (currentProjectId && currentTaskId) {
        try {
          const res: any = await api.get(`/projects/${currentProjectId}`);
          const projectTasks = res.tasks || [];
          const currentIndex = projectTasks.findIndex((pt: any) => pt.taskId?._id === currentTaskId);
          const nextPending = projectTasks.slice(currentIndex + 1).find((pt: any) => pt.status === 'pending');
          
          if (nextPending) {
            setAutoStart({
              taskId: nextPending.taskId._id,
              projectId: currentProjectId,
              taskName: nextPending.taskId.name,
              taskColor: nextPending.taskId.color,
              projectTaskId: nextPending._id,
            }, 5);
          }
        } catch (err) {
          console.error('Failed to trigger auto start next task:', err);
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Error al guardar la sesión.', 'error');
    }
  };

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
      {isRunning && (
        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-4 py-1.5 rounded-full shadow-lg max-w-sm truncate animate-pulse-ring">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-ping"
            style={{ backgroundColor: activeTaskColor }}
          />
          <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <div className="flex flex-col text-left max-w-[120px]">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Cronometrando</span>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{activeTaskName}</span>
          </div>
          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 ml-2">
            {formatTime(seconds)}
          </span>
          <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 ml-1">
            {isPaused ? (
              <button
                onClick={resumeTimer}
                title="Reanudar"
                className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current opacity-20" />
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                title="Pausar"
                className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current opacity-20" />
              </button>
            )}
            <button
              onClick={handleStop}
              title="Guardar y finalizar"
              className="p-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={() => setCompact(true)}
              title="Modo compacto"
              className="p-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-4">
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
