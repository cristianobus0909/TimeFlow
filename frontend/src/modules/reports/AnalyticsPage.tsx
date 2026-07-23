import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { AlertCircle, Clock, Award, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const AnalyticsPage = () => {
  // Fetch detailed statistics
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['analyticsData'],
    queryFn: () => api.get('/analytics/stats'),
  });

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4 animate-bounce" />
        <h3 className="font-bold text-zinc-300">Error al cargar estadísticas</h3>
        <p className="text-xs">Por favor, intente de nuevo más tarde.</p>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-48" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl" />
          <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl" />
          <div className="h-32 bg-zinc-900 border border-zinc-800 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px] bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-[300px] bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // 1. Bar Chart Data: Daily Trend
  const barData = stats.dailyTrend?.map((item: any) => ({
    name: formatDate(item.date),
    Horas: parseFloat((item.duration / 3600).toFixed(2)),
  })) || [];

  // 2. Pie Chart Data: Productivity Ratio
  const activeVal = stats.productivityRatio?.active || 0;
  const breakVal = stats.productivityRatio?.break || 0;
  const deadVal = stats.productivityRatio?.deadTime || 0;
  const totalRatio = activeVal + breakVal + deadVal;

  const pieData = [
    { name: 'Tiempo Activo', value: activeVal, color: '#7C3AED' }, // purple
    { name: 'Descansos', value: breakVal, color: '#10B981' }, // green
    { name: 'Tiempos Muertos', value: deadVal, color: '#EF4444' }, // red
  ].filter((item) => item.value > 0);

  return (
    <div className="flex flex-col gap-8 select-text">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 font-display">Analíticas de Productividad</h2>
        <p className="text-zinc-500 text-xs mt-0.5">Reporte detallado sobre promedios matemáticos y eficiencias</p>
      </div>

      {/* Numerical Averages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hoverable className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-brand-purple" />
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Mediana Histórica</span>
            <p className="text-lg font-black text-zinc-200 mt-0.5">{formatHours(stats.median || 0)}</p>
          </div>
        </Card>

        <Card hoverable className="flex items-center gap-4">
          <Award className="w-8 h-8 text-emerald-400" />
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Moda de Duración</span>
            <p className="text-lg font-black text-zinc-200 mt-0.5">{formatHours(stats.mode || 0)}</p>
          </div>
        </Card>

        <Card hoverable className="flex items-center gap-4">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Sesiones Totales</span>
            <p className="text-lg font-black text-zinc-200 mt-0.5">{barData.filter((item: any) => item.Horas > 0).length} días activos</p>
          </div>
        </Card>
      </div>

      {/* Main charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily worked hours bar chart */}
        <Card className="flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-200">Horas Trabajadas por Día</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Historial acumulativo de tus últimas jornadas</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525B" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525B" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#1f1f23', radius: 4 }}
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#E4E4E7',
                  }}
                />
                <Bar dataKey="Horas" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Productivity Ratio pie chart */}
        <Card className="flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-200">Ratio de Productividad</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Comparación de trabajo vs pausas en los últimos 30 días</p>
          </div>
          <div className="h-[250px] w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            {pieData.length > 0 ? (
              <>
                <div className="w-[180px] h-[180px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181B',
                          borderColor: '#27272A',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#E4E4E7',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5 w-full sm:w-auto">
                  {pieData.map((item, idx) => {
                    const percentage = totalRatio > 0 ? Math.round((item.value / totalRatio) * 100) : 0;
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs text-zinc-400 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="flex-grow">{item.name}</span>
                        <span className="text-zinc-200 font-bold ml-1">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-zinc-600 text-xs py-10">
                Registra tu primera tarea y pausas para calcular el ratio
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Rank */}
        <Card>
          <h3 className="text-sm font-bold text-zinc-200 mb-1">Ranking de Tareas</h3>
          <p className="text-[10px] text-zinc-500 mb-6">Tareas con mayor inversión de tiempo acumulado</p>
          <div className="flex flex-col gap-3">
            {stats.taskRanking?.map((task: any, idx: number) => (
              <div
                key={task._id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-900 text-xs font-semibold"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="text-zinc-500 w-4 font-mono font-bold text-[10px]">#{idx + 1}</span>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.color }} />
                  <span className="text-zinc-200 truncate">{task.name}</span>
                </div>
                <span className="text-zinc-400 font-bold ml-2">{formatHours(task.totalDuration)}</span>
              </div>
            ))}
            {(!stats.taskRanking || stats.taskRanking.length === 0) && (
              <div className="py-12 text-center text-xs text-zinc-600">
                Aún no tienes tareas registradas en el historial.
              </div>
            )}
          </div>
        </Card>

        {/* Projects Rank */}
        <Card>
          <h3 className="text-sm font-bold text-zinc-200 mb-1">Ranking de Proyectos</h3>
          <p className="text-[10px] text-zinc-500 mb-6">Proyectos con mayor inversión de tiempo acumulado</p>
          <div className="flex flex-col gap-3">
            {stats.projectRanking?.map((proj: any, idx: number) => (
              <div
                key={proj._id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-zinc-900 text-xs font-semibold"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="text-zinc-500 w-4 font-mono font-bold text-[10px]">#{idx + 1}</span>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
                  <span className="text-zinc-200 truncate">{proj.name}</span>
                </div>
                <span className="text-zinc-400 font-bold ml-2">{formatHours(proj.accumulatedDuration)}</span>
              </div>
            ))}
            {(!stats.projectRanking || stats.projectRanking.length === 0) && (
              <div className="py-12 text-center text-xs text-zinc-600">
                Aún no tienes proyectos registrados en el historial.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default AnalyticsPage;
