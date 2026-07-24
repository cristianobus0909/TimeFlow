import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Query projects and tasks
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks'),
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to generate calendar cells
  const getDaysInMonth = (y: number, m: number) => {
    const date = new Date(y, m, 1);
    const days = [];
    
    // Fill padding from previous month
    const dayOfWeek = date.getDay();
    const prevMonthDays = new Date(y, m, 0).getDate();
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(y, m - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Fill current month days
    const totalDays = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(y, m, i),
        isCurrentMonth: true,
      });
    }

    // Fill padding for next month to complete 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(y, m + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-brand-purple" />
          <h2 className="text-lg font-bold text-zinc-100 font-display">
            {monthNames[month]} {year}
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-250 rounded-xl cursor-pointer transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl cursor-pointer transition-all"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-250 rounded-xl cursor-pointer transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid calendar */}
      <Card className="p-4 flex flex-col gap-2">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 uppercase pb-2 border-b border-zinc-900/60">
          <span>Dom</span>
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1.5 min-h-[60vh]">
          {calendarDays.map((cell, idx) => {
            const dateStr = cell.date.toDateString();
            
            // Filter tasks matching due dates
            const dayTasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate).toDateString() === dateStr);
            
            // Filter projects starting or ending today
            const dayProjects = projects.filter((p: any) => {
              const startMatch = p.startDate && new Date(p.startDate).toDateString() === dateStr;
              const endMatch = p.endDate && new Date(p.endDate).toDateString() === dateStr;
              return startMatch || endMatch;
            });

            const isToday = new Date().toDateString() === dateStr;

            return (
              <div
                key={idx}
                className={`bg-zinc-900/20 border p-2 rounded-xl flex flex-col gap-2 h-28 overflow-y-auto select-none transition-all ${
                  cell.isCurrentMonth ? 'border-zinc-900' : 'border-zinc-950/20 opacity-30'
                } ${isToday ? 'bg-brand-purple/5 border-brand-purple/40 ring-1 ring-brand-purple/20' : ''}`}
              >
                {/* Date Label */}
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${
                    isToday ? 'text-brand-purple' : cell.isCurrentMonth ? 'text-zinc-450' : 'text-zinc-650'
                  }`}>
                    {cell.date.getDate()}
                  </span>
                </div>

                {/* Day events render */}
                <div className="flex flex-col gap-1">
                  {dayTasks.map((t: any) => (
                    <div
                      key={t._id}
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 flex items-center gap-1 text-zinc-350 truncate"
                      title={`Vencimiento Tarea: ${t.name || t.title}`}
                    >
                      <CheckCircle className="w-2 h-2 text-brand-purple flex-shrink-0" />
                      <span className="truncate">{t.name || t.title}</span>
                    </div>
                  ))}

                  {dayProjects.map((p: any) => {
                    const isEnd = p.endDate && new Date(p.endDate).toDateString() === dateStr;
                    return (
                      <div
                        key={p._id}
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded border truncate text-white"
                        style={{
                          backgroundColor: `${p.color}15`,
                          borderColor: p.color,
                          color: p.color,
                        }}
                        title={`${isEnd ? 'Entrega' : 'Inicio'} de Proyecto: ${p.name}`}
                      >
                        <span className="truncate">{isEnd ? '🏁' : '🚀'} {p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
export default CalendarPage;
