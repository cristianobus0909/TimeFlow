import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@shared/services/api';
import { timerStore } from '@/store/timerStore';
import { authStore } from '@/store/authStore';
import { 
  Play, 
  Target, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Award, 
  Zap, 
  Star,
  Activity,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { toastStore } from '@/store/toastStore';

export const CommandCenterPage: React.FC = () => {
  const { user } = authStore();
  const { showToast } = toastStore();
  const { isRunning, isPaused, seconds, activeSessionId, startTimer, stopTimer, pauseTimer, resumeTimer } = timerStore();

  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['commandCenterOverview', activeSessionId],
    queryFn: () => api.get('/dashboard/overview'),
    refetchInterval: isRunning ? 5000 : false,
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

  const formatDecimalHours = (hours: number) => {
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <AlertTriangle className="w-10 h-10 text-rose-500 mb-4 animate-bounce" />
        <h3 className="font-bold text-zinc-300">Error al cargar Command Center</h3>
        <p className="text-xs">Por favor, intente de nuevo más tarde.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 select-none animate-pulse">
        <div className="h-44 bg-zinc-100 dark:bg-zinc-900 rounded-3xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
          <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
          <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  const today = overview?.today || { totalHours: 0, effectiveHours: 0, breakHours: 0, amount: 0, sessionsCount: 0 };
  const dailyGoal = overview?.dailyGoal || { targetHours: 8, targetAmount: 200 };
  const recommendation = overview?.recommendation || { action: 'Nueva sesión', title: 'Empieza a registrar tiempo', subtitle: 'Registra tus horas del día', type: 'general' };
  const productivity = overview?.productivity || [];
  const money = overview?.money || { today: 0, week: 0, month: 0 };
  const projects = overview?.projects || [];
  const clients = overview?.clients || [];
  const alerts = overview?.alerts || [];
  const coach = overview?.coach || 'Buen ritmo de trabajo hoy.';
  const achievements = overview?.achievements || { title: 'Primer cliente premium', description: '¡Sigue sumando horas!' };

  const targetAmount = dailyGoal.targetAmount || 200;
  const goalPercentage = targetAmount > 0 ? Math.round((today.amount / targetAmount) * 100) : 0;
  const remainingAmount = Math.max(0, targetAmount - today.amount);

  const handleRecommendationClick = () => {
    if (isRunning) {
      showToast('Ya hay una sesión activa corriendo.', 'error');
      return;
    }
    if (recommendation.type === 'task') {
      startTimer(recommendation.targetId, null, recommendation.title, '#7C3AED');
      showToast(`Temporizador iniciado para: ${recommendation.title}`);
    } else if (recommendation.type === 'project') {
      showToast('Ve al listado de tareas del proyecto para iniciar un temporizador.');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-1 max-w-7xl mx-auto w-full select-none">
      {/* 🚀 Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl relative overflow-hidden shadow-sm dark:shadow-none"
      >
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-white font-display">
              Buenos días, {user?.name || 'Christian'} 👋
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Hoy has generado <span className="font-bold text-zinc-950 dark:text-white">{today.amount.toFixed(2)} EUR</span> •{' '}
              <span className="text-violet-600 dark:text-violet-400 font-bold">{goalPercentage}%</span> del objetivo diario
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 w-full md:w-64">
            <div className="flex justify-between w-full text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <span>Progreso diario</span>
              <span>{goalPercentage}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-violet-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, goalPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid of Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 🎯 Tarjeta 1: Objetivo del Día */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-violet-500" />
                Objetivo de Hoy
              </span>
              <span className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-md font-bold">
                Diario
              </span>
            </div>
            <div className="flex items-baseline justify-between py-4">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-400">Objetivo</span>
                <span className="text-xl font-bold text-zinc-950 dark:text-white">{targetAmount} EUR</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-zinc-400">Restan</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {remainingAmount.toFixed(2)} EUR
                </span>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-900/60 p-3 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 leading-tight">
              Te faltan aproximadamente{' '}
              <span className="font-bold text-violet-600 dark:text-violet-400">
                {formatDecimalHours(Math.max(0, dailyGoal.targetHours - today.effectiveHours))}
              </span>{' '}
              de trabajo efectivo hoy.
            </div>
          </Card>
        </motion.div>

        {/* ⏱️ Tarjeta 2: Sesión Activa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                Sesión Activa
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                {isRunning ? (isPaused ? 'Pausado' : 'Corriendo') : 'Idle'}
              </span>
            </div>
            
            {isRunning ? (
              <div className="flex flex-col gap-3 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col leading-tight max-w-[180px] truncate">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wide truncate">
                      {overview?.currentSession?.clientName || 'Sin Cliente'}
                    </span>
                    <span className="text-sm font-bold text-zinc-950 dark:text-white truncate mt-0.5">
                      {overview?.currentSession?.taskName}
                    </span>
                  </div>
                  <span className="font-mono text-xl font-bold text-zinc-950 dark:text-white">
                    {formatSeconds(seconds)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-900 pt-2.5">
                  <span className="text-zinc-500">Monto actual:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-200">
                    {((seconds / 3600) * (overview?.currentSession?.hourlyRate || 0)).toFixed(2)} EUR
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 text-zinc-500 my-auto">
                <Clock className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-xs font-semibold">No hay temporizador corriendo</span>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
              {isRunning && (
                <>
                  {isPaused ? (
                    <Button onClick={resumeTimer} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold border-none">
                      Reanudar
                    </Button>
                  ) : (
                    <Button onClick={pauseTimer} className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold border-none">
                      Pausar
                    </Button>
                  )}
                  <Button onClick={stopTimer} className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold border-none">
                    Finalizar
                  </Button>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 🧠 Tarjeta 3: Recomendación Inteligente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-violet-500" />
                Recomendación
              </span>
            </div>
            <div className="flex flex-col gap-1 py-3 leading-tight">
              <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">
                {recommendation.action}
              </span>
              <span className="text-sm font-bold text-zinc-950 dark:text-zinc-200 mt-1 line-clamp-2">
                {recommendation.title}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 truncate">
                {recommendation.subtitle}
              </span>
            </div>
            {recommendation.type === 'task' ? (
              <Button
                onClick={handleRecommendationClick}
                className="w-full bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-none"
              >
                Iniciar sesión recomendada
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <div className="text-[10px] text-zinc-500 text-center leading-none py-2 border-t border-zinc-100 dark:border-zinc-900">
                La aplicación sugiere tareas según su impacto y prioridad.
              </div>
            )}
          </Card>
        </motion.div>

        {/* 💵 Tarjeta 4: Valor Generado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                Valor Generado
              </span>
            </div>
            <div className="flex flex-col gap-3 py-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">Hoy</span>
                <span className="font-bold text-zinc-950 dark:text-white font-mono">{money.today.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-zinc-900 pt-2.5">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">Esta Semana</span>
                <span className="font-bold text-zinc-950 dark:text-white font-mono">{money.week.toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-zinc-900 pt-2.5">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">Este Mes</span>
                <span className="font-bold text-zinc-950 dark:text-white font-mono">{money.month.toFixed(2)} EUR</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ⏱️ Tarjeta 5: Tiempo de Hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-500" />
                Tiempo de Hoy
              </span>
            </div>
            <div className="flex-grow flex flex-col gap-3 py-2 overflow-y-auto max-h-[140px] pr-1 mt-2">
              {productivity.map((prod: any, idx: number) => {
                const total = productivity.reduce((sum: number, p: any) => sum + p.hours, 0);
                const pct = total > 0 ? (prod.hours / total) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-semibold text-zinc-700 dark:text-zinc-300">
                      <span>{prod.category}</span>
                      <span>{prod.hours.toFixed(1)}h</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden p-0.5">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {productivity.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500 leading-normal my-auto">
                  Aún no has registrado ninguna sesión hoy.
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 🏢 Tarjeta 6: Proyectos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-violet-500" />
                Proyectos Activos
              </span>
            </div>
            <div className="flex-grow flex flex-col gap-3 py-2 overflow-y-auto max-h-[140px] pr-1 mt-2">
              {projects.map((proj: any) => (
                <div key={proj._id} className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5 truncate max-w-[130px]">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
                    {proj.name}
                  </span>
                  <div className="flex flex-col text-right text-[10px] text-zinc-500">
                    <span className="font-bold text-zinc-850 dark:text-zinc-200 font-mono">
                      {proj.hoursUsed}h / {proj.hoursAvailable + proj.hoursUsed}h
                    </span>
                    <span>{proj.profitability.toFixed(2)} EUR</span>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500 leading-normal my-auto">
                  No hay proyectos activos registrados.
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 🌟 Tarjeta 7: Clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-violet-500" />
                Clientes por Rentabilidad
              </span>
            </div>
            <div className="flex-grow flex flex-col gap-3 py-2 overflow-y-auto max-h-[140px] pr-1 mt-2">
              {clients.map((cli: any) => (
                <div key={cli._id} className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-col">
                    <span>{cli.name}</span>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-2.5 h-2.5 ${i < cli.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200 dark:text-zinc-800'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-200 font-mono">{cli.amount.toFixed(2)} EUR</span>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500 leading-normal my-auto">
                  No hay clientes registrados en el sistema.
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ⚠️ Tarjeta 8: Alertas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertas
              </span>
            </div>
            <div className="flex-grow flex flex-col gap-2 py-2 overflow-y-auto max-h-[140px] pr-1 mt-2">
              {alerts.map((alert: string, index: number) => (
                <div 
                  key={index}
                  className="p-2 border border-amber-200/40 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/10 text-amber-800 dark:text-amber-400 rounded-lg text-[10px] leading-tight font-semibold"
                >
                  ⚠️ {alert}
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-500 leading-normal my-auto">
                  No hay alertas registradas hoy.
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 👨‍🏫 Tarjeta 9: Coach */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="flex flex-col justify-between h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl min-h-[220px]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-violet-500" />
                Coach de Productividad
              </span>
            </div>
            <div className="flex-grow flex items-center py-4 my-auto">
              <p className="text-xs italic text-zinc-700 dark:text-zinc-350 leading-relaxed font-medium">
                "{coach}"
              </p>
            </div>
            <div className="text-[9px] text-zinc-400 text-center leading-none border-t border-zinc-100 dark:border-zinc-900 pt-3">
              Consejos calculados automáticamente en base a tu actividad diaria.
            </div>
          </Card>
        </motion.div>

        {/* 🏆 Tarjeta 10: Logros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-2 lg:col-span-3"
        >
          <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl select-none flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl" />
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Award className="w-7 h-7 fill-amber-500/10" />
            </div>
            <div className="flex flex-col gap-0.5 leading-tight">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Hito Relevante</span>
              <span className="text-sm font-bold text-zinc-950 dark:text-white mt-0.5">{achievements.title}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{achievements.description}</span>
            </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};
export default CommandCenterPage;
