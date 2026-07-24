import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Mail, Phone, Briefcase, Trash2, ArrowUpRight, Search, Building } from 'lucide-react';
import { api } from '@shared/services/api';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { Input } from '@shared/components/Input';
import { Modal } from '@shared/components/Modal';
import { toastStore } from '@/store/toastStore';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = toastStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    currency: 'USD',
    notes: '',
    color: '#7C3AED',
  });

  // Query Clients List
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients'),
  });

  // Create Client Mutation
  const createClientMutation = useMutation({
    mutationFn: (data: any) => api.post('/clients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showToast('Cliente creado exitosamente.');
      setIsModalOpen(false);
      setNewClient({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        currency: 'USD',
        notes: '',
        color: '#7C3AED',
      });
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al crear cliente', 'error');
    },
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim()) {
      showToast('El nombre del cliente es obligatorio.', 'error');
      return;
    }
    createClientMutation.mutate(newClient);
  };

  const filteredClients = clients.filter((c: any) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-display">Tus Clientes</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Gestiona empresas, contactos y rentabilidad operativa</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o empresa..."
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-zinc-700 transition-all"
          />
        </div>

        <div className="flex gap-1 bg-zinc-900 p-0.5 rounded-xl border border-zinc-800">
          {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold cursor-pointer transition-all ${
                statusFilter === status ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {status === 'ACTIVE' ? 'Activos' : status === 'INACTIVE' ? 'Inactivos' : 'Archivados'}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-zinc-500">Cargando clientes...</div>
      ) : filteredClients.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-3xl">
          No se encontraron clientes en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: any) => (
            <Card
              key={client._id}
              hoverable
              onClick={() => navigate(`/clients/${client._id}`)}
              className="flex flex-col gap-6 relative group cursor-pointer"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: client.color }} />

              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200 group-hover:text-brand-purple transition-all">
                    {client.name}
                  </h3>
                  {client.company && (
                    <div className="flex items-center gap-1.5 mt-1 text-zinc-500 text-[10px] font-semibold">
                      <Building className="w-3 h-3 text-zinc-600" />
                      <span>{client.company}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/clients/${client._id}`);
                  }}
                  className="p-1.5 bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer flex items-center justify-center"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Statistics placeholders */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-900/60 py-4 text-center">
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/50">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Proyectos</span>
                  <p className="text-zinc-300 text-xs font-black mt-0.5">Activos</p>
                </div>
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/50">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Moneda</span>
                  <p className="text-zinc-300 text-xs font-black mt-0.5">{client.currency}</p>
                </div>
              </div>

              {/* Contacts info footer */}
              <div className="flex flex-col gap-2 text-[10px] text-zinc-500">
                {client.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-zinc-650" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-650" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-650" />
                  <span>{client.contacts?.length || 0} contactos registrados</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Client Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Nuevo Cliente">
        <form onSubmit={handleCreateClient} className="flex flex-col gap-4">
          <Input
            label="Nombre del Cliente (Obligatorio)"
            placeholder="ej. Juan Pérez, María Rodríguez..."
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
          />

          <Input
            label="Empresa / Razón Social (Opcional)"
            placeholder="ej. Acme Corp, Globex SA..."
            value={newClient.company}
            onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              placeholder="ej. admin@cliente.com"
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            />
            <Input
              label="Teléfono / WhatsApp"
              placeholder="ej. +34 600000000"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tax ID / CUIT (Opcional)"
              placeholder="ej. 30-12345678-9"
              value={newClient.taxId}
              onChange={(e) => setNewClient({ ...newClient, taxId: e.target.value })}
            />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Moneda Preferida</span>
              <select
                value={newClient.currency}
                onChange={(e) => setNewClient({ ...newClient, currency: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-zinc-700 h-10"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="ARS">ARS ($)</option>
                <option value="MXN">MXN ($)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Color del Cliente</span>
            <div className="flex gap-2.5 mt-1.5 flex-wrap">
              {['#7C3AED', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewClient({ ...newClient, color: c })}
                  className="w-7 h-7 rounded-full relative cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {newClient.color === c && (
                    <div className="absolute inset-1 border-2 border-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createClientMutation.isPending}>
              Guardar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ClientsPage;
