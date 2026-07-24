import React from 'react';
import { timerStore } from '@/store/timerStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/services/api';
import { Briefcase, Tag } from 'lucide-react';
import { Card } from '@shared/components/Card';
import { TimerControls } from './TimerControls';

export const RunningTaskCard: React.FC = () => {
  const { isRunning, seconds, activeSessionId, activeTaskName } = timerStore();

  const { data: activeSession } = useQuery({
    queryKey: ['activeSessionData', activeSessionId],
    queryFn: () => api.get('/work-sessions/active'),
    enabled: !!activeSessionId,
  });

  if (!isRunning) return null;

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

  const projectColor = activeSession?.project?.color || '#7C3AED';
  const projectName = activeSession?.project?.name || 'Sin Proyecto';
  const clientName = activeSession?.client?.name || 'Sin Cliente';
  const billingRate = activeSession?.hourlyRate || 0;
  const billable = activeSession?.billable !== false;

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-2xl relative overflow-hidden select-none">
      <div 
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: projectColor }}
      />
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {clientName} / {projectName}
            </span>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1 truncate max-w-[240px]">{activeTaskName}</h3>
          </div>
          <div className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
            {activeSession?.complexity || 'MEDIUM'}
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-y border-zinc-100 dark:border-zinc-900">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Tiempo Transcurrido</span>
            <span className="font-mono text-2xl font-bold text-zinc-950 dark:text-white mt-0.5">
              {formatSeconds(seconds)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Tarifa Acordada</span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
              {billable ? `${billingRate} EUR/h` : 'No facturable'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {activeSession?.category?.name || activeSession?.category || 'General'}
          </span>
          <TimerControls />
        </div>
      </div>
    </Card>
  );
};
export default RunningTaskCard;
