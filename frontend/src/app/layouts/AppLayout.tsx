import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '@shared/components/CommandPalette';
import { ToastContainer } from '@shared/components/ToastContainer';
import { timerStore } from '@/store/timerStore';
import { settingsStore } from '@/store/settingsStore';
import { toastStore } from '@/store/toastStore';
import { themeStore } from '@/store/themeStore';
import { Button } from '@shared/components/Button';
import { Play, Pause, Square, Maximize2, Keyboard } from 'lucide-react';
import { api } from '@shared/services/api';

export const AppLayout = () => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { showToast } = toastStore();
  const { loadSettings } = settingsStore();
  const { theme } = themeStore();
  const location = useLocation();
  const isFocusMode = location.pathname === '/focus';
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  
  const {
    syncFromBackend,
    isCompact,
    setCompact,
    activeTaskId,
    activeProjectId,
    activeProjectTaskId,
    activeTaskName,
    activeTaskColor,
    isRunning,
    isPaused,
    seconds,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tick,
    nextTaskToAutoStart,
    autoStartCountdown,
    setAutoStart,
    decrementAutoStart,
    startTimer,
  } = timerStore();

  // Sync settings and check running timer on boot
  useEffect(() => {
    loadSettings();
    syncFromBackend();
  }, [loadSettings, syncFromBackend]);

  // Tick the timer globally (persists when sub-components are unmounted in compact mode)
  useEffect(() => {
    let interval: any = null;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, tick]);

  // Auto-start transition timer ticking & triggering logic
  useEffect(() => {
    let timer: any = null;
    if (nextTaskToAutoStart && autoStartCountdown > 0) {
      timer = setInterval(() => {
        decrementAutoStart();
      }, 1000);
    } else if (nextTaskToAutoStart && autoStartCountdown === 0) {
      // Trigger the next task!
      startTimer(
        nextTaskToAutoStart.taskId,
        nextTaskToAutoStart.projectId,
        nextTaskToAutoStart.taskName,
        nextTaskToAutoStart.taskColor,
        nextTaskToAutoStart.projectTaskId
      );
      showToast(`Tarea iniciada: ${nextTaskToAutoStart.taskName}`);
      setAutoStart(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [nextTaskToAutoStart, autoStartCountdown, decrementAutoStart, startTimer, setAutoStart, showToast]);

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

  const handleCompactStop = async () => {
    try {
      await stopTimer();
      showToast('Sesión guardada con éxito.');
      setCompact(false);
    } catch (error: any) {
      showToast(error.message || 'Error al guardar la sesión.', 'error');
    }
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Toggle compact mode: Alt + M
      if (e.altKey && e.code === 'KeyM') {
        e.preventDefault();
        setCompact(!isCompact);
        return;
      }

      // Command Palette: Ctrl+K / Cmd+K (only in full mode)
      if (!isCompact && e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        return;
      }

      // Compact Mode Controls
      if (isCompact) {
        if (e.code === 'Space') {
          e.preventDefault();
          if (isRunning) {
            if (isPaused) resumeTimer();
            else pauseTimer();
          }
        } else if (e.code === 'KeyS') {
          e.preventDefault();
          if (isRunning) {
            handleCompactStop();
          }
        } else if (e.code === 'Escape') {
          e.preventDefault();
          setCompact(false); // Maximize
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [isCompact, isRunning, isPaused, setCompact, pauseTimer, resumeTimer, activeTaskId, activeProjectId]);

  // Document Picture-in-Picture Handler
  useEffect(() => {
    let activePipWindow: any = null;

    const enterPip = async () => {
      if (isCompact && 'documentPictureInPicture' in window) {
        try {
          // Open always-on-top PiP window suited for horizontal pill size
          const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
            width: 380,
            height: 64,
          });

          activePipWindow = pipWindow;
          (window as any).pipWindow = pipWindow;

          // Copy stylesheets to the PiP window to match full design aesthetics
          [...document.styleSheets].forEach((styleSheet) => {
            try {
              const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
              const style = pipWindow.document.createElement('style');
              style.textContent = cssRules;
              pipWindow.document.head.appendChild(style);
            } catch (e) {
              const link = pipWindow.document.createElement('link');
              if (styleSheet.href) {
                link.rel = 'stylesheet';
                link.href = styleSheet.href;
                pipWindow.document.head.appendChild(link);
              }
            }
          });

          // Style body
          pipWindow.document.body.style.margin = '0';
          pipWindow.document.body.style.backgroundColor = theme === 'dark' ? '#09090B' : '#FAFAFA';
          pipWindow.document.body.style.overflow = 'hidden';

          // Create mount node
          const container = pipWindow.document.createElement('div');
          container.id = 'pip-root';
          pipWindow.document.body.appendChild(container);

          setPipContainer(container);

          // Listen for manual window close
          pipWindow.addEventListener('pagehide', () => {
            setCompact(false);
            setPipContainer(null);
            (window as any).pipWindow = null;
          });
        } catch (err) {
          console.error('Failed to open Picture-in-Picture window:', err);
        }
      } else {
        // Close if existing
        if ((window as any).pipWindow) {
          (window as any).pipWindow.close();
          (window as any).pipWindow = null;
        }
        setPipContainer(null);
      }
    };

    enterPip();

    return () => {
      if (activePipWindow) {
        activePipWindow.close();
      }
    };
  }, [isCompact, setCompact, theme]);

  if (isCompact) {
    const miniPlayerContent = nextTaskToAutoStart ? (
      <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-4 py-1.5 rounded-full shadow-lg max-w-sm truncate">
        {/* Glowing dot representing current activity */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-ping bg-brand-emerald" />
        
        {/* Clock icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>

        {/* Task description */}
        <div className="flex flex-col text-left max-w-[120px]">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
            Siguiente Tarea
          </span>
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate" style={{ color: nextTaskToAutoStart.taskColor }}>
            {nextTaskToAutoStart.taskName}
          </span>
        </div>

        {/* Timer countdown */}
        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 ml-2">
          00:00:0{autoStartCountdown}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 ml-1">
          <button
            onClick={() => setAutoStart(nextTaskToAutoStart, 0)}
            title="Iniciar Ya"
            className="p-1 rounded-md text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500/10 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current opacity-20" />
          </button>
          <button
            onClick={() => setAutoStart(null)}
            title="Cancelar"
            className="p-1 rounded-md text-rose-500 dark:text-rose-450 hover:bg-rose-500/10 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>
    ) : (
      <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 px-4 py-1.5 rounded-full shadow-lg max-w-sm truncate animate-pulse-ring">
        {/* Glowing dot representing current activity */}
        {isRunning && !isPaused ? (
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-ping" style={{ backgroundColor: activeTaskColor || '#7C3AED' }} />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-zinc-400 dark:bg-zinc-600" />
        )}
        
        {/* Clock icon */}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-4 h-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>

        {/* Task description */}
        <div className="flex flex-col text-left max-w-[120px]">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
            {isRunning ? 'Cronometrando' : 'Sin Actividad'}
          </span>
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {isRunning ? activeTaskName : 'TimeFlow'}
          </span>
        </div>

        {/* Timer countdown */}
        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 ml-2">
          {isRunning ? formatTime(seconds) : '00:00:00'}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 ml-1">
          {isRunning && (
            <>
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
                  className="p-1 rounded-md text-amber-600 dark:text-amber-450 hover:bg-amber-500/10 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current opacity-20" />
                </button>
              )}
              <button
                onClick={handleCompactStop}
                title="Guardar y finalizar"
                className="p-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </>
          )}

          {/* Toggle back to full screen / maximize */}
          <button
            onClick={() => setCompact(false)}
            title="Modo completo"
            className="p-1 rounded-md text-zinc-550 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );

    const themedWrapper = (
      <div className={`${theme === 'dark' ? 'dark' : ''} flex items-center justify-center h-full w-full p-2 overflow-hidden select-none`}>
        {miniPlayerContent}
      </div>
    );

    if (pipContainer) {
      return (
        <div className={`${theme === 'dark' ? 'dark' : ''} flex flex-col items-center justify-center h-screen w-screen bg-zinc-950 text-zinc-100 p-8 border border-zinc-900 select-none`}>
          <div className="flex flex-col items-center justify-center text-center max-w-sm gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-850 shadow-2xl">
            <div className="p-3 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-full animate-pulse-ring">
              <Maximize2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-200 text-sm">Píldora flotante activa</h3>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              TimeFlow se encuentra minimizado en una ventana flotante "Siempre al frente" (Always-on-Top). Puedes interactuar libremente con ella.
            </p>
            <Button
              onClick={() => setCompact(false)}
              className="bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple text-brand-purple hover:text-white px-4 py-1.5 rounded-xl font-bold transition-all text-xs"
            >
              Restaurar Ventana Principal
            </Button>
          </div>
          
          {createPortal(themedWrapper, pipContainer)}
          <ToastContainer />
        </div>
      );
    }

    return (
      <div className={`${theme === 'dark' ? 'dark bg-zinc-950' : 'bg-zinc-50'} flex items-center justify-center h-screen w-screen overflow-hidden select-none border border-zinc-900/10 dark:border-zinc-800/80`}>
        {miniPlayerContent}
        <ToastContainer />
      </div>
    );
  }

  if (isFocusMode) {
    return (
      <div className="bg-zinc-950 text-zinc-100 h-screen w-screen overflow-hidden select-none">
        <Outlet />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content */}
      <div className="flex flex-col flex-grow h-full overflow-hidden">
        {/* Top Header */}
        <Header onSearchClick={() => setIsPaletteOpen(true)} />

        {/* Page Wrapper */}
        <main className="flex-grow overflow-y-auto bg-zinc-950 p-8 select-text">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Command Palette Overlay */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Auto-Start Countdown Banner Overlay (Full Mode) */}
      {nextTaskToAutoStart && (
        <div className="absolute bottom-6 right-6 w-80 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl z-50 flex flex-col gap-4 text-xs select-none">
          <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Siguiente Tarea en Proyecto</span>
            <button
              onClick={() => setAutoStart(null)}
              className="text-[10px] text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Animated Ring */}
            <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" className="stroke-zinc-800 fill-none" strokeWidth="3" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-brand-emerald fill-none transition-all duration-1000"
                  strokeWidth="3"
                  strokeDasharray="125"
                  strokeDashoffset={(125 * (5 - autoStartCountdown)) / 5}
                />
              </svg>
              <span className="font-mono text-sm font-black text-brand-emerald">{autoStartCountdown}</span>
            </div>

            <div className="text-left flex-grow truncate">
              <span className="text-[10px] text-zinc-500 block font-semibold">Comenzando automáticamente</span>
              <span className="text-xs font-bold text-zinc-200 truncate block mt-0.5" style={{ color: nextTaskToAutoStart.taskColor }}>
                {nextTaskToAutoStart.taskName}
              </span>
            </div>
          </div>

          <Button
            onClick={() => setAutoStart(nextTaskToAutoStart, 0)}
            size="sm"
            className="w-full bg-brand-emerald hover:bg-brand-emerald-hover text-white border-transparent"
          >
            Iniciar Ya
          </Button>
        </div>
      )}

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
export default AppLayout;
