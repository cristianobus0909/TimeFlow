import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Building,
  Calendar,
  Briefcase,
  Plus,
} from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';

export const FinancialDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Query Financial Dashboard data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: () => api.get('/financial/dashboard'),
  });

  if (isLoading || !dashboard) {
    return <div className="py-16 text-center text-xs text-zinc-500">Cargando panel financiero...</div>;
  }

  const { metrics, pendingInvoices = [], topProjects = [], cashFlow } = dashboard;

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 font-display">Panel Ejecutivo Financiero</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Control de ingresos, gastos y rentabilidad operativa</p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/expenses')} variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
            Registrar Gasto
          </Button>
          <Button size="sm" onClick={() => navigate('/invoices')} leftIcon={<Receipt className="w-4 h-4" />}>
            Emitir Factura
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card hoverable className="flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Ingresos del Mes</span>
            <p className="text-2xl font-black text-zinc-200 mt-2">${metrics.income.toFixed(2)}</p>
          </div>
          <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Flujo positivo de cobros
          </span>
        </Card>

        <Card hoverable className="flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Gastos del Mes</span>
            <p className="text-2xl font-black text-rose-400 mt-2">${metrics.expenses.toFixed(2)}</p>
          </div>
          <span className="text-[9px] text-rose-500 flex items-center gap-1 font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Egresos operativos
          </span>
        </Card>

        <Card hoverable className="flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Margen Neto</span>
            <p className="text-2xl font-black text-brand-purple mt-2">{metrics.margin}%</p>
          </div>
          <span className="text-[9px] text-zinc-500 block">Beneficio neto / Ingresos</span>
        </Card>

        <Card hoverable className="flex flex-col justify-between gap-3">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Facturación Pendiente</span>
            <p className="text-2xl font-black text-zinc-200 mt-2">${metrics.totalPendingAmount.toFixed(2)}</p>
          </div>
          <span className="text-[9px] text-zinc-500 block">Facturas emitidas sin cobrar</span>
        </Card>
      </div>

      {/* Main layout grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main grids (Projects & Cash Flow) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Projects Profitability list */}
          <Card className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Rentabilidad por Proyecto</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Ingresos acumulados restando gastos asociados</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {topProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-600">Aún no hay proyectos con transacciones financieras registradas.</div>
              ) : (
                topProjects.map((p: any) => (
                  <div key={p._id} className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-zinc-200 truncate">{p.name}</span>
                    </div>

                    <div className="flex gap-6 text-right">
                      <div>
                        <span className="text-[9px] text-zinc-650 block">Gastos</span>
                        <span className="text-rose-400 font-mono">${p.expenses.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-650 block">Beneficio</span>
                        <span className="text-emerald-400 font-mono font-black">${p.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Simple Cash Flow Projection Card */}
          <Card className="flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Proyección de Flujo de Caja</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Cobros previstos para los próximos 30 días</p>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider block">Cobros Estimados</span>
                <p className="text-xl font-black text-brand-purple mt-1">${cashFlow.expectedInflows.toFixed(2)}</p>
              </div>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-zinc-650" />
                Vencimiento facturas
              </span>
            </div>
          </Card>
        </div>

        {/* Right side invoices list */}
        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-200">Facturas Pendientes</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Últimas facturas emitidas pendientes de pago</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {pendingInvoices.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-600">No hay facturas pendientes de cobro.</div>
            ) : (
              pendingInvoices.map((inv: any) => (
                <div
                  key={inv._id}
                  onClick={() => navigate('/invoices')}
                  className="bg-zinc-950 hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs font-semibold cursor-pointer transition-all"
                >
                  <div className="flex flex-col text-left truncate gap-0.5">
                    <span className="text-zinc-250 truncate">{inv.number}</span>
                    <span className="text-[10px] text-zinc-500 truncate">{inv.client?.name || 'Cliente'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 font-mono">
                    <span className="text-zinc-200">${inv.total.toFixed(2)}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-950/20 text-amber-400 uppercase font-extrabold">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default FinancialDashboardPage;
