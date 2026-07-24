import React from 'react';
import { Play, Pause, Square, Trash2 } from 'lucide-react';
import { timerStore } from '@/store/timerStore';
import { Button } from '@shared/components/Button';

export const TimerControls: React.FC = () => {
  const { isRunning, isPaused, pauseTimer, resumeTimer, stopTimer, cancelTimer } = timerStore();

  if (!isRunning) return null;

  return (
    <div className="flex items-center gap-2 select-none">
      {isPaused ? (
        <Button
          onClick={resumeTimer}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all text-xs font-semibold border-none"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Reanudar
        </Button>
      ) : (
        <Button
          onClick={pauseTimer}
          className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all text-xs font-semibold border-none"
        >
          <Pause className="w-3.5 h-3.5 fill-current" />
          Pausar
        </Button>
      )}

      <Button
        onClick={() => {
          if (confirm('¿Desea finalizar la sesión actual de trabajo?')) {
            stopTimer();
          }
        }}
        className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all text-xs font-semibold border-none"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
        Detener
      </Button>

      <Button
        onClick={() => {
          if (confirm('¿Está seguro que desea cancelar la sesión actual? No se registrará el tiempo en su historial.')) {
            cancelTimer();
          }
        }}
        className="bg-transparent hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 rounded-xl p-2 transition-all flex items-center justify-center border-none"
        title="Cancelar Sesión"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
export default TimerControls;
