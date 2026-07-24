import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/services/api';
import { Flame, Star, Activity } from 'lucide-react';
import { Card } from '@shared/components/Card';

export const FocusWidget: React.FC = () => {
  const { data: focusOverview, isLoading, error } = useQuery({
    queryKey: ['focusWidgetOverview'],
    queryFn: () => api.get('/focus/overview'),
  });

  const { data: streak } = useQuery({
    queryKey: ['focusWidgetStreak'],
    queryFn: () => api.get('/focus/streaks'),
  });

  if (isLoading || error) return null;

  return (
    <Card className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col gap-4 select-none">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-violet-500" />
          Rendimiento de Foco
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-1 leading-tight">
          <span className="text-[10px] text-zinc-400 uppercase font-bold">Racha</span>
          <div className="flex items-center gap-1 text-orange-500 mt-0.5">
            <Flame className="w-4 h-4 fill-orange-500/10" />
            <span className="text-base font-bold font-mono">{streak?.currentStreak || 0}d</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 leading-tight border-x border-zinc-100 dark:border-zinc-900">
          <span className="text-[10px] text-zinc-400 uppercase font-bold">Concentración</span>
          <div className="flex items-center gap-0.5 text-amber-500 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3.5 h-3.5 ${i < (focusOverview?.focusScore || 5) ? 'text-amber-500 fill-amber-500' : 'text-zinc-200 dark:text-zinc-800'}`} 
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 leading-tight">
          <span className="text-[10px] text-zinc-400 uppercase font-bold">Productividad</span>
          <span className="text-base font-bold text-violet-600 dark:text-violet-400 font-mono mt-0.5">
            {focusOverview?.productivityScore || 0}%
          </span>
        </div>
      </div>
    </Card>
  );
};
export default FocusWidget;
