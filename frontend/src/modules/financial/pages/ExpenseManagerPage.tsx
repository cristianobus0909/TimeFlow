import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingDown, Calendar, Tag, CreditCard, ShoppingBag } from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Modal } from '@shared/components/Modal';
import { Input } from '@shared/components/Input';
import { toastStore } from '@/store/toastStore';

export const ExpenseManagerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = toastStore();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Expense creation states
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<'SOFTWARE' | 'HOSTING' | 'MARKETING' | 'EQUIPMENT' | 'TRAVEL' | 'TRAINING' | 'SERVICES' | 'OTHERS'>('OTHERS');
  const [projectId, setProjectId] = useState('');
  const [date, setDate] = useState('');

  // Queries
  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/financial/expenses'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => api.post('/financial/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      showToast('Gasto registrado con éxito.');
      resetExpenseForm();
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al registrar el gasto', 'error');
    },
  });

  const resetExpenseForm = () => {
    setIsExpenseModalOpen(false);
    setDescription('');
    setSupplier('');
    setAmount(0);
    setCategory('OTHERS');
    setProjectId('');
    setDate('');
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Debe ingresar una descripción.', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('El monto debe ser superior a cero.', 'error');
      return;
    }
    createExpenseMutation.mutate({
      description,
      supplier,
      amount,
      category,
      project: projectId || undefined,
      date: date || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 font-display">Control de Gastos</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Registre y distribuya costos fijos u operativos</p>
        </div>

        <Button size="sm" onClick={() => setIsExpenseModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Registrar Gasto
        </Button>
      </div>

      {/* Expenses list card */}
      <Card className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-200">Historial de Egresos</h3>

        {isExpensesLoading ? (
          <div className="text-center py-8 text-xs text-zinc-500">Cargando egresos...</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-650 border border-dashed border-zinc-900 rounded-2xl">
            No hay gastos registrados todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900/60 text-zinc-550 font-bold">
                  <th className="pb-3 pr-4">Concepto</th>
                  <th className="pb-3 pr-4">Proveedor</th>
                  <th className="pb-3 pr-4">Categoría</th>
                  <th className="pb-3 pr-4">Proyecto</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {expenses.map((exp: any) => (
                  <tr key={exp._id} className="group hover:bg-zinc-950/20">
                    <td className="py-3.5 pr-4 text-zinc-200 font-semibold">{exp.description}</td>
                    <td className="py-3.5 pr-4 text-zinc-400">{exp.supplier || 'N/D'}</td>
                    <td className="py-3.5 pr-4">
                      <span className="px-2 py-0.5 rounded text-[8px] bg-zinc-900 text-zinc-400 uppercase font-extrabold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      {exp.project ? (
                        <span className="flex items-center gap-1.5 text-zinc-350">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: exp.project.color }} />
                          {exp.project.name}
                        </span>
                      ) : (
                        <span className="text-zinc-600">General</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-500">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="py-3.5 text-right font-mono text-rose-455 font-bold">${exp.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Expense registration modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={resetExpenseForm} title="Registrar Gasto Operativo">
        <form onSubmit={handleSubmitExpense} className="flex flex-col gap-4 text-xs">
          <Input
            label="Descripción del Gasto"
            placeholder="ej. Licencia de software, hosting mensual..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Proveedor / Supplier"
              placeholder="ej. AWS, Vercel, Slack"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
            <Input
              label="Monto ($)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Categoría</span>
              <select
                className="bg-zinc-900 border border-zinc-800 focus:border-brand-purple text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none w-full"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                required
              >
                <option value="SOFTWARE">Software</option>
                <option value="HOSTING">Hosting</option>
                <option value="MARKETING">Marketing</option>
                <option value="EQUIPMENT">Equipamiento</option>
                <option value="TRAVEL">Viajes</option>
                <option value="TRAINING">Capacitación</option>
                <option value="SERVICES">Servicios</option>
                <option value="OTHERS">Otros</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Proyecto Asociado (Opcional)</span>
              <select
                className="bg-zinc-900 border border-zinc-800 focus:border-brand-purple text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none w-full"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Ninguno (Gasto general)</option>
                {projects.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Fecha del Gasto"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={resetExpenseForm}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createExpenseMutation.isPending}>
              Guardar Gasto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ExpenseManagerPage;
