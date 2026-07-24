import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Receipt, DollarSign, Calendar, Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Modal } from '@shared/components/Modal';
import { Input } from '@shared/components/Input';
import { toastStore } from '@/store/toastStore';

export const InvoiceManagerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = toastStore();

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Invoice creation form states
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, rate: 0 }]);
  const [taxes, setTaxes] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Payment registration form states
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'CARD' | 'PAYPAL' | 'STRIPE' | 'MERCADO_PAGO' | 'OTHER'>('TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');

  // Queries
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/financial/invoices'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients'),
  });

  // Fetch work sessions of selected client to auto-load hours
  const { data: clientSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['work-sessions-client', clientId],
    queryFn: () => api.get(`/work-sessions?client=${clientId}`),
    enabled: !!clientId && isInvoiceModalOpen,
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => api.post('/financial/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      showToast('Factura creada exitosamente.');
      resetInvoiceForm();
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al crear la factura', 'error');
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => api.post('/financial/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'] });
      showToast('Pago registrado exitosamente.');
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount(0);
      setPaymentReference('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al registrar el pago', 'error');
    },
  });

  const resetInvoiceForm = () => {
    setIsInvoiceModalOpen(false);
    setClientId('');
    setDueDate('');
    setNotes('');
    setItems([{ description: '', quantity: 1, rate: 0 }]);
    setTaxes(0);
    setDiscount(0);
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const next = [...items];
    next[index][field] = val;
    setItems(next);
  };

  // Auto-populate line items from client's logged work sessions
  const handleLoadWorkSessions = () => {
    if (clientSessions.length === 0) {
      showToast('No se encontraron sesiones de trabajo para este cliente.', 'info');
      return;
    }

    // Calculate total hours of completed work sessions
    const totalSeconds = clientSessions
      .filter((s: any) => s.status === 'COMPLETED' || s.duration > 0)
      .reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

    // Use default client rate or task rate if available
    const selectedClient = clients.find((c: any) => c._id === clientId);
    const rate = selectedClient?.hourlyRate || 50; // default $50/hr if none

    setItems([
      {
        description: `Horas de trabajo acumuladas - ${selectedClient?.name || 'Cliente'}`,
        quantity: totalHours || 1,
        rate: rate,
      },
    ]);
    showToast('Horas cargadas automáticamente de las sesiones.');
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      showToast('Debe seleccionar un cliente.', 'error');
      return;
    }
    if (!dueDate) {
      showToast('La fecha de vencimiento es obligatoria.', 'error');
      return;
    }
    createInvoiceMutation.mutate({
      client: clientId,
      dueDate,
      notes,
      items,
      taxes,
      discount,
    });
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    createPaymentMutation.mutate({
      invoice: selectedInvoice._id,
      amount: paymentAmount,
      paymentMethod,
      reference: paymentReference,
    });
  };

  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.rate), 0);
  const total = subtotal + Number(taxes) - Number(discount);

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 font-display">Facturación y Cobros</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Gestione facturas emitidas y registre cobros de clientes</p>
        </div>

        <Button size="sm" onClick={() => setIsInvoiceModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Nueva Factura
        </Button>
      </div>

      {/* Invoices List Card */}
      <Card className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-zinc-200">Listado de Facturas</h3>

        {isInvoicesLoading ? (
          <div className="text-center py-8 text-xs text-zinc-500">Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-650 border border-dashed border-zinc-900 rounded-2xl">
            Aún no se han emitido facturas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-900/60 text-zinc-550 font-bold">
                  <th className="pb-3 pr-4">Número</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Emisión</th>
                  <th className="pb-3 pr-4">Vencimiento</th>
                  <th className="pb-3 pr-4 text-right">Total</th>
                  <th className="pb-3 pr-4 text-center">Estado</th>
                  <th className="pb-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950">
                {invoices.map((inv: any) => (
                  <tr key={inv._id} className="group hover:bg-zinc-950/20">
                    <td className="py-3.5 pr-4 text-zinc-200 font-semibold">{inv.number}</td>
                    <td className="py-3.5 pr-4 text-zinc-350">{inv.client?.name || 'Cliente'}</td>
                    <td className="py-3.5 pr-4 text-zinc-500">{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td className="py-3.5 pr-4 text-zinc-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="py-3.5 pr-4 text-right font-mono text-zinc-200 font-bold">${inv.total.toFixed(2)}</td>
                    <td className="py-3.5 pr-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        inv.status === 'PAID' ? 'bg-emerald-950/20 text-emerald-400' :
                        inv.status === 'PENDING' ? 'bg-amber-955/20 text-amber-400' : 'bg-zinc-900 text-zinc-450'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status !== 'PAID' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentAmount(inv.total);
                              setIsPaymentModalOpen(true);
                            }}
                            leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                          >
                            Registrar Cobro
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice Creation Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={resetInvoiceForm} title="Emitir Nueva Factura">
        <form onSubmit={handleSubmitInvoice} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Cliente</span>
              <select
                className="bg-zinc-900 border border-zinc-800 focus:border-brand-purple text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none w-full"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Seleccione Cliente...</option>
                {clients.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.company || 'Sin Empresa'})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {/* Load client sessions trigger */}
          {clientId && (
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleLoadWorkSessions}
                className="text-[10px] text-brand-purple bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                Cargar Horas de Sesiones
              </button>
            </div>
          )}

          {/* Line items list */}
          <div className="flex flex-col gap-2.5 mt-2">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="font-bold text-zinc-300">Líneas de Factura</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-brand-purple hover:underline font-bold cursor-pointer"
              >
                + Agregar Concepto
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6">
                  <Input
                    label={idx === 0 ? "Descripción / Concepto" : ""}
                    placeholder="ej. Desarrollo Web"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    label={idx === 0 ? "Cant" : ""}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    label={idx === 0 ? "Tarifa" : ""}
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="col-span-1 pb-1">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-400 font-bold p-1 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Taxes & Discounts */}
          <div className="grid grid-cols-2 gap-4 mt-4 border-t border-zinc-900 pt-4">
            <Input
              label="Impuestos (ej. IVA, Retenciones)"
              type="number"
              value={taxes}
              onChange={(e) => setTaxes(Number(e.target.value))}
            />
            <Input
              label="Descuento"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          {/* Summary / Total preview */}
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex justify-between items-center mt-2 font-semibold">
            <div className="text-left">
              <span className="text-[9px] text-zinc-650 block uppercase tracking-wider">Subtotal: ${subtotal.toFixed(2)}</span>
              <span className="text-[10px] text-zinc-400 block">Impuestos: +${taxes} | Descuento: -${discount}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-600 block uppercase">Total Factura</span>
              <span className="text-lg font-black text-brand-purple">${total.toFixed(2)}</span>
            </div>
          </div>

          <Input
            label="Notas de la factura"
            placeholder="ej. Detalles de transferencia o cuenta bancaria..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={resetInvoiceForm}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createInvoiceMutation.isPending}>
              Emitir Factura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Registration Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Registrar Cobro">
        {selectedInvoice && (
          <form onSubmit={handleSubmitPayment} className="flex flex-col gap-4 text-xs">
            <p className="text-xs text-zinc-500 mb-2">
              Registre el cobro de la factura <strong className="text-zinc-200">{selectedInvoice.number}</strong> (Total: ${selectedInvoice.total.toFixed(2)}).
            </p>

            <Input
              label="Monto Cobrado"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              required
            />

            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Método de Pago</span>
              <select
                className="bg-zinc-900 border border-zinc-800 focus:border-brand-purple text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none w-full"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                required
              >
                <option value="TRANSFER">Transferencia</option>
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta de Crédito/Débito</option>
                <option value="PAYPAL">PayPal</option>
                <option value="STRIPE">Stripe</option>
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <Input
              label="Referencia / Nro Transacción (Opcional)"
              placeholder="ej. Transferencia #908234"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createPaymentMutation.isPending}>
                Guardar Cobro
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default InvoiceManagerPage;
