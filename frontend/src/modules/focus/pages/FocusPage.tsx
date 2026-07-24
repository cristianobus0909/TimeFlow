import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/services/api';
import { timerStore } from '@/store/timerStore';
import { 
  Play, 
  Pause, 
  ArrowLeft,
  Target, 
  Clock, 
  AlertTriangle,
  Award,
  Zap,
  Activity,
  Flame
} from 'lucide-react';
import { Button } from '@shared/components/Button';
import { toastStore } from '@/store/toastStore';

export const FocusPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = toastStore();
  const { isRunning, isPaused, seconds, activeSessionId, stopTimer, pauseTimer, resumeTimer } = timerStore();

  // Query Focus Overview
  const { data: focusOverview, refetch } = useQuery({
    queryKey: ['focusOverview', activeSessionId],
    queryFn: () => api.get('/focus/overview'),
    refetchInterval: isRunning ? 5000 : false,
  });

  // Query User Streak
  const { data: streak } = useQuery({
    queryKey: ['userStreak'],
    queryFn: () => api.get('/focus/streaks'),
  });

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

  // Remind about 90 min breaks
  useEffect(() => {
    if (focusOverview?.breaksAlert) {
      showToast(focusOverview.breaksAlert, 'info');
    }
  }, [focusOverview?.breaksAlert]);

  const currentSession = focusOverview?.currentSession;
  const progress = focusOverview?.dailyProgress?.hours || { target: 8, achieved: 0 };
  const targetHours = progress.target || 8;
  const achievedHours = progress.achieved || 0;
  const progressPercent = Math.min(100, Math.round((achievedHours / targetHours) * 100));

  const amountAchieved = focusOverview?.dailyProgress?.amount?.achieved || 0;
  const hourlyRate = currentSession?.hourlyRate || 0;
  const sessionEarnings = (seconds / 3600) * hourlyRate;
  const totalTodayEarnings = amountAchieved + (isRunning ? sessionEarnings : 0);

  const handleStop = async () => {
    try {
      await stopTimer();
      showToast('Sesión guardada con éxito.');
      refetch();
    } catch (e: any) {
      showToast(e.message || 'Error al detener el temporizador.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100 flex flex-col justify-between p-8 z-50 overflow-hidden font-display select-none">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center relative z-10">
        <Button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Salir del Modo Focus
        </Button>

        {streak && streak.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-600/10 border border-orange-500/20 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-400">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500/15" />
            <span>Racha de {streak.currentStreak} días</span>
          </div>
        )}
      </div>

      {/* Main Focus Clock */}
      <div className="flex flex-col items-center justify-center flex-grow py-8 relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl" />
        
        {isRunning ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center gap-6"
          >
            <div className="font-mono text-7xl md:text-8xl font-black text-white tracking-tight drop-shadow-md select-none">
              {formatSeconds(seconds)}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                {currentSession?.clientName || 'Sin Cliente'} • {currentSession?.projectName || 'Sin Proyecto'}
              </span>
              <span className="text-xl md:text-2xl font-bold text-zinc-100 max-w-lg truncate">
                {currentSession?.taskName}
              </span>
              <span className="text-sm font-semibold text-emerald-400 mt-1 font-mono">
                + {sessionEarnings.toFixed(2)} EUR generados
              </span>
            </div>

            {/* Daily Goal progress inside Focus View */}
            <div className="flex flex-col items-center gap-2 mt-4 w-72">
              <div className="flex justify-between w-full text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-violet-500" />
                  Progreso del día
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-900 border border-zinc-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-violet-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 mt-8">
              {isPaused ? (
                <Button 
                  onClick={resumeTimer}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 border-none shadow-lg shadow-emerald-600/20"
                >
                  <Play className="w-6 h-6 fill-white" />
                </Button>
              ) : (
                <Button 
                  onClick={pauseTimer}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-full p-4 border border-zinc-800"
                >
                  <Pause className="w-6 h-6 fill-zinc-200" />
                </Button>
              )}
              <Button 
                onClick={handleStop}
                className="bg-violet-600 hover:bg-violet-500 text-white rounded-full p-4 border-none shadow-lg shadow-violet-600/20"
              >
                <Target className="w-6 h-6" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-zinc-500">
            <Clock className="w-16 h-16 opacity-30 mb-3" />
            <h2 className="text-lg font-bold text-zinc-400">Modo Focus Inactivo</h2>
            <p className="text-xs max-w-sm mt-1">
              Ve al menú de Tareas o al Command Center para iniciar una sesión de trabajo y entrar en concentración profunda.
            </p>
          </div>
        )}
      </div>

      {/* Daily Progress metrics bottom bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-zinc-900/40 border border-zinc-900/80 p-5 rounded-2xl relative z-10 max-w-4xl mx-auto w-full backdrop-blur-sm">
        <div className="flex flex-col leading-tight border-r border-zinc-900/60 pr-4">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Productivity Score</span>
          <span className="text-lg font-bold text-zinc-100 mt-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-violet-500" />
            {focusOverview?.productivityScore || 0} / 100
          </span>
        </div>
        <div className="flex flex-col leading-tight border-r border-zinc-900/60 pr-4">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Focus Quality</span>
          <span className="text-lg font-bold text-amber-500 mt-1">
            {'★'.repeat(focusOverview?.focusScore || 5)}
            {'☆'.repeat(5 - (focusOverview?.focusScore || 5))}
          </span>
        </div>
        <div className="flex flex-col leading-tight border-r border-zinc-900/60 pr-4">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Horas de Hoy</span>
          <span className="text-lg font-bold text-zinc-100 mt-1 font-mono">
            {achievedHours.toFixed(1)}h / {targetHours}h
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ganado Hoy</span>
          <span className="text-lg font-bold text-zinc-100 mt-1 font-mono">
            {totalTodayEarnings.toFixed(2)} EUR
          </span>
        </div>
      </div>

    </div>
  );
};
export default FocusPage;
