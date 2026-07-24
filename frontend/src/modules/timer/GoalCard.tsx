import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Target, Save, Edit2 } from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface GoalCardProps {
  todayEffectiveHours: number;
  todayEarnings: number;
}

export const GoalCard: React.FC<GoalCardProps> = ({ todayEffectiveHours, todayEarnings }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hoursInput, setHoursInput] = useState('8');
  const [amountInput, setAmountInput] = useState('200');

  const { data: dailyGoal, isLoading } = useQuery({
    queryKey: ['todayDailyGoal'],
    queryFn: async () => {
      const res: any = await api.get('/work-sessions/goals/today');
      if (res) {
        setHoursInput(res.targetHours?.toString() || '8');
        setAmountInput(res.targetAmount?.toString() || '200');
      }
      return res;
    },
  });

  const saveGoalMutation = useMutation({
    mutationFn: (data: { targetHours: number; targetAmount: number }) =>
      api.post('/work-sessions/goals', { ...data, date: new Date() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayDailyGoal'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    const hours = parseFloat(hoursInput) || 0;
    const amount = parseFloat(amountInput) || 0;
    saveGoalMutation.mutate({ targetHours: hours, targetAmount: amount });
  };

  if (isLoading) {
    return <div className="h-32 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse" />;
  }

  const targetHours = dailyGoal?.targetHours || 8;
  const targetAmount = dailyGoal?.targetAmount || 200;

  const hoursPercentage = targetHours > 0 ? (todayEffectiveHours / targetHours) * 100 : 0;
  const amountPercentage = targetAmount > 0 ? (todayEarnings / targetAmount) * 100 : 0;

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-2xl select-none">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-violet-500" />
          Objetivo Diario
        </h4>
        {isEditing ? (
          <Button
            onClick={handleSave}
            className="text-[10px] bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-2 py-1 flex items-center gap-1 border-none"
            disabled={saveGoalMutation.isPending}
          >
            <Save className="w-3 h-3" />
            Guardar
          </Button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-all"
          >
            <Edit2 className="w-3 h-3" />
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Horas Objetivo</label>
            <input
              type="number"
              value={hoursInput}
              onChange={(e) => setHoursInput(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">Monto Objetivo (€)</label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <CircularProgress
            percentage={hoursPercentage}
            size={72}
            strokeWidth={5}
            colorClass="text-violet-500"
            centerText={`${Math.round(hoursPercentage)}%`}
          />
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Horas Trabajadas</span>
                <span className="font-bold text-zinc-950 dark:text-white">{todayEffectiveHours.toFixed(1)}h / {targetHours}h</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="bg-violet-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, hoursPercentage)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Valor Generado</span>
                <span className="font-bold text-zinc-950 dark:text-white">{todayEarnings.toFixed(2)} € / {targetAmount} €</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, amountPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
export default GoalCard;
