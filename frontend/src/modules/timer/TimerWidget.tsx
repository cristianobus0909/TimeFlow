import React from 'react';
import { timerStore } from '@/store/timerStore';
import { TimerControls } from './TimerControls';
import { Clock } from 'lucide-react';

export const TimerWidget: React.FC = () => {
  const { isRunning, isPaused, seconds, activeTaskName, activeTaskColor } = timerStore();

  if (!isRunning) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl text-zinc-400 dark:text-zinc-500 text-xs select-none">
        <Clock className="w-3.5 h-3.5 opacity-60" />
        <span>Sin cronómetros activos</span>
      </div>
    );
  }

  const formatSeconds = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm dark:shadow-none select-none transition-all">
      <div className="flex items-center gap-2">
        <div 
          className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'animate-pulse'}`}
          style={!isPaused ? { backgroundColor: activeTaskColor || '#7C3AED' } : undefined}
        />
        <span className="font-mono text-base font-bold text-zinc-950 dark:text-white leading-none">
          {formatSeconds(seconds)}
        </span>
      </div>
      <div className="hidden sm:block border-l border-zinc-200 dark:border-zinc-800 h-6" />
      <div className="hidden sm:flex flex-col max-w-[200px] truncate leading-tight">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
          {isPaused ? 'Pausado' : 'Trabajando en'}
        </span>
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{activeTaskName}</span>
      </div>
      <div className="border-l border-zinc-200 dark:border-zinc-800 h-6" />
      <TimerControls />
    </div>
  );
};
export default TimerWidget;
