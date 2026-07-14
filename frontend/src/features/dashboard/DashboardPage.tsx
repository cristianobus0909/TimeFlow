import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  Folder,
  CheckCircle,
  Play,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { timerStore } from '../../store/timerStore';
import { toastStore } from '../../store/toastStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useEffect } from 'react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startTimer, isRunning } = timerStore();
  const { showToast } = toastStore();

  // Listen to timer stop event to refetch dashboard statistics
  useEffect(() => {
    const handleReload = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['analyticsData'] });
    };
    window.addEventListener('session-logged', handleReload);
    return () => window.removeEventListener('session-logged', handleReload);
  }, [queryClient]);

  // Fetch Dashboard Stats
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => api.get('/analytics/dashboard'),
  });

  // Fetch Analytics Stats (for trend charts)
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: () => api.get('/analytics/stats'),
  });

  const isLoading = dashLoading || analyticsLoading;

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  if (dashError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4 animate-bounce" />
        <h3 className="font-bold text-zinc-300">Error al cargar datos</h3>
        <p className="text-xs">Por favor, intente de nuevo más tarde.</p>
      </div>
    );
  }

  // Fallbacks for loading state (Skeleton loader loaders)
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 select-none">
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[350px] bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-[350px] bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const workedToday = dashboard?.workedTime?.today || 0;
  const workedWeek = dashboard?.workedTime?.week || 0;
  const workedMonth = dashboard?.workedTime?.month || 0;
  const totalHours = dashboard?.workedTime?.total || 0;

  // Chart formatter
  const chartData = analytics?.dailyTrend?.map((item: any) => ({
    name: formatDate(item.date),
    Horas: parseFloat((item.duration / 3600).toFixed(2)),
  })) || [];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-display">Resumen Diario</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Aquí está tu rendimiento de hoy</p>
        </div>
        <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-brand-purple" />
          Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Hoy Trabajado</span>
            <Clock className="w-4 h-4 text-brand-purple" />
          </div>
          <p className="text-2xl font-bold text-zinc-100">{formatHours(workedToday)}</p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Meta diaria: 6h</span>
        </Card>

        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Esta Semana</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-100">{formatHours(workedWeek)}</p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Total acumulado</span>
        </Card>

        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Proyectos Activos</span>
            <Folder className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-100">{dashboard?.activeProjectsCount || 0}</p>
          <span className="text-[10px] text-zinc-500 mt-1 block">En ejecución</span>
        </Card>

        <Card hoverable className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tareas Realizadas</span>
            <CheckCircle className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-100">{dashboard?.completedTasksCount || 0}</p>
          <span className="text-[10px] text-zinc-500 mt-1 block">Con ejecuciones</span>
        </Card>
      </div>

      {/* Charts and Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Tendencia de Trabajo (Horas)</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Últimos 14 días registrados</p>
            </div>
            <span className="text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-lg text-zinc-400 font-semibold font-mono">
              Total: {parseFloat((totalHours / 3600).toFixed(1))}h
            </span>
          </div>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525B" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525B" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#E4E4E7',
                  }}
                />
                <Area type="monotone" dataKey="Horas" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Breakdown list */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 mb-1">Distribución por Categorías</h3>
            <p className="text-[10px] text-zinc-500 mb-6">Porcentaje de tiempo dedicado</p>
          </div>
          <div className="flex-grow flex flex-col gap-4 overflow-y-auto max-h-[220px] pr-1">
            {dashboard?.categoryBreakdown?.map((cat: any, i: number) => {
              const totalDuration = dashboard.categoryBreakdown.reduce((sum: number, c: any) => sum + c.duration, 0);
              const percentage = totalDuration > 0 ? Math.round((cat.duration / totalDuration) * 100) : 0;
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.category}
                    </span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden p-0.5">
                    <div className="h-full rounded-full" style={{ backgroundColor: cat.color, width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
            {(!dashboard?.categoryBreakdown || dashboard.categoryBreakdown.length === 0 || dashboard.categoryBreakdown[0]?.duration === 0) && (
              <div className="flex items-center justify-center py-10 text-xs text-zinc-600">
                Registra tu primera tarea para ver estadísticas
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Sessions & Fast Launch task */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent sessions list */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Últimas Actividades</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Tus sesiones de tiempo más recientes</p>
            </div>
            <Link to="/history" className="text-xs font-semibold text-brand-purple hover:underline cursor-pointer">
              Ver historial
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {dashboard?.recentSessions?.map((session: any) => (
              <div
                key={session._id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-900/60 hover:border-zinc-800/80 transition-all text-xs"
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.taskId?.color || '#7C3AED' }}
                  />
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-zinc-200 truncate">
                      {session.taskId?.name || 'Tarea Eliminada'}
                    </span>
                    <span className="text-[9px] text-zinc-500 truncate mt-0.5">
                      {session.taskId?.category || 'General'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right flex flex-col">
                    <span className="font-semibold text-zinc-300">
                      {formatHours(session.duration)}
                    </span>
                    <span className="text-[9px] text-zinc-500 mt-0.5">
                      {formatDate(session.startTime)} • {formatTime(session.startTime)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!dashboard?.recentSessions || dashboard.recentSessions.length === 0) && (
              <div className="py-12 text-center text-xs text-zinc-600">
                Aún no has registrado ninguna sesión de tiempo.
              </div>
            )}
          </div>
        </Card>

        {/* Quick Launch widget */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 mb-1">Inicio Rápido</h3>
            <p className="text-[10px] text-zinc-500 mb-6">Inicia un cronómetro inmediatamente</p>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1">
            {dashboard?.recentSessions?.slice(0, 3).map((session: any) => (
              <button
                key={`quick-${session._id}`}
                onClick={() => {
                  if (isRunning) {
                    showToast('Ya hay un temporizador corriendo. Detenlo primero.', 'error');
                    return;
                  }
                  startTimer(session.taskId?._id, session.projectId?._id, session.taskId?.name, session.taskId?.color);
                  showToast(`Temporizador iniciado para: ${session.taskId?.name}`);
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900/60 hover:border-zinc-800 transition-all text-xs font-semibold text-zinc-300 w-full text-left group cursor-pointer"
              >
                <span className="truncate flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: session.taskId?.color }} />
                  {session.taskId?.name}
                </span>
                <Play className="w-3.5 h-3.5 text-zinc-500 group-hover:text-brand-purple transition-colors fill-zinc-500/10" />
              </button>
            ))}
            {(!dashboard?.recentSessions || dashboard.recentSessions.length === 0) && (
              <div className="py-12 text-center text-xs text-zinc-600">
                Crea tareas en el gestor para iniciar rápido.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default DashboardPage;
