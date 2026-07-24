import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  User,
  Clock,
  MessageSquare,
  Activity,
  Plus,
  Send,
  Globe,
  Settings,
  Calendar,
} from 'lucide-react';
import { api } from '@shared/services/api';
import { Button } from '@shared/components/Button';
import { Card } from '@shared/components/Card';
import { Input } from '@shared/components/Input';
import { Modal } from '@shared/components/Modal';
import { toastStore } from '@/store/toastStore';

type TabType = 'general' | 'projects' | 'contacts' | 'comments' | 'timeline';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = toastStore();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Input states for comments/contacts
  const [commentText, setCommentText] = useState('');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    whatsApp: '',
    notes: '',
  });

  // Query Client Details
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get(`/clients/${id}`),
    enabled: !!id,
  });

  // Query Client Projects
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  // Query Comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', 'CLIENT', id],
    queryFn: () => api.get(`/comments?refType=CLIENT&refId=${id}`),
    enabled: !!id && activeTab === 'comments',
  });

  // Query Timeline
  const { data: events = [] } = useQuery({
    queryKey: ['timeline', 'CLIENT', id],
    queryFn: () => api.get(`/timeline?refType=CLIENT&refId=${id}`),
    enabled: !!id && activeTab === 'timeline',
  });

  // Update Client (for contacts, note changes, etc.)
  const updateClientMutation = useMutation({
    mutationFn: (updatedData: any) => api.put(`/clients/${id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      showToast('Ficha de cliente actualizada.');
      setIsContactModalOpen(false);
      setNewContact({ name: '', role: '', email: '', phone: '', whatsApp: '', notes: '' });
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al actualizar', 'error');
    },
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: (text: string) =>
      api.post('/comments', { refType: 'CLIENT', refId: id, content: text }),
    onSuccess: () => {
      setCommentText('');
      refetchComments();
      showToast('Comentario añadido.');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al enviar comentario', 'error');
    },
  });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) {
      showToast('El nombre de contacto es obligatorio.', 'error');
      return;
    }
    const currentContacts = client.contacts || [];
    updateClientMutation.mutate({
      contacts: [...currentContacts, newContact],
    });
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  if (isClientLoading) {
    return <div className="py-16 text-center text-xs text-zinc-500">Cargando detalles del cliente...</div>;
  }

  if (!client) {
    return <div className="py-16 text-center text-xs text-rose-500">Cliente no encontrado.</div>;
  }

  const clientProjects = projects.filter((p: any) => p.client === id);

  return (
    <div className="flex flex-col gap-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-zinc-100 font-display">{client.name}</h2>
          <p className="text-zinc-500 text-xs mt-0.5">{client.company || 'Sin empresa vinculada'}</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-zinc-900/60 pb-px gap-1 overflow-x-auto">
        {(
          [
            { key: 'general', label: 'General', icon: <Building className="w-3.5 h-3.5" /> },
            { key: 'projects', label: 'Proyectos', icon: <Clock className="w-3.5 h-3.5" /> },
            { key: 'contacts', label: 'Contactos', icon: <User className="w-3.5 h-3.5" /> },
            { key: 'comments', label: 'Comentarios', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { key: 'timeline', label: 'Actividad', icon: <Activity className="w-3.5 h-3.5" /> },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === t.key
                ? 'border-brand-purple text-zinc-200 bg-brand-purple/5'
                : 'border-transparent text-zinc-550 hover:text-zinc-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="mt-2">
        {/* Tab 1: General Info */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 flex flex-col gap-6">
              <h3 className="text-sm font-bold text-zinc-300">Información de la Ficha</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Email</span>
                  <p className="text-zinc-200 mt-1 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-650" />
                    {client.email || 'No registrado'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Teléfono</span>
                  <p className="text-zinc-200 mt-1 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-650" />
                    {client.phone || 'No registrado'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Sitio Web</span>
                  <p className="text-zinc-200 mt-1 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-zinc-650" />
                    {client.website ? (
                      <a href={client.website} target="_blank" rel="noreferrer" className="text-brand-purple hover:underline">
                        {client.website}
                      </a>
                    ) : (
                      'No registrado'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Tax ID / CUIT</span>
                  <p className="text-zinc-200 mt-1 font-mono">{client.taxId || 'No registrado'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Zona Horaria</span>
                  <p className="text-zinc-200 mt-1 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-zinc-650" />
                    {client.timezone || 'UTC'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Moneda</span>
                  <p className="text-zinc-200 mt-1 font-mono">{client.currency || 'USD'}</p>
                </div>
              </div>

              <div className="border-t border-zinc-900/60 pt-4 flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Notas del Cliente</span>
                <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-wrap">
                  {client.notes || 'Sin anotaciones o notas adicionales agregadas.'}
                </p>
              </div>
            </Card>

            <Card className="flex flex-col gap-6">
              <h3 className="text-sm font-bold text-zinc-300">Resumen Financiero</h3>
              <div className="flex flex-col gap-4 text-center">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Horas Trabajadas</span>
                  <p className="text-2xl font-black text-zinc-200 mt-1">--</p>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Total Facturado</span>
                  <p className="text-2xl font-black text-brand-purple mt-1">{client.currency} $0.00</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Associated Projects */}
        {activeTab === 'projects' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-300">Proyectos Vinculados</h3>
            </div>
            {isProjectsLoading ? (
              <div className="text-center py-8 text-xs text-zinc-500">Cargando proyectos...</div>
            ) : clientProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-2xl">
                Este cliente no tiene ningún proyecto asociado actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clientProjects.map((p: any) => (
                  <Card
                    key={p._id}
                    hoverable
                    onClick={() => navigate(`/projects/${p._id}`)}
                    className="cursor-pointer relative group flex flex-col justify-between gap-6"
                  >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: p.color }} />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200 group-hover:text-brand-purple transition-all">
                        {p.name}
                      </h4>
                      {p.description && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-zinc-900/60 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-650" />
                        Fin: {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'Sin definir'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full uppercase text-[8px] font-extrabold ${
                        p.status === 'ACTIVE' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-zinc-950 text-zinc-450'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Contacts Directory */}
        {activeTab === 'contacts' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-300">Directorio de Contactos</h3>
              <Button size="sm" onClick={() => setIsContactModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Agregar Contacto
              </Button>
            </div>

            {(!client.contacts || client.contacts.length === 0) ? (
              <div className="py-12 text-center text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-2xl">
                No hay contactos registrados para este cliente.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {client.contacts.map((contact: any, index: number) => (
                  <Card key={index} className="flex flex-col gap-3 relative group">
                    <div>
                      <h4 className="text-xs font-black text-zinc-200">{contact.name}</h4>
                      {contact.role && <p className="text-[10px] text-brand-purple font-bold uppercase mt-0.5">{contact.role}</p>}
                    </div>

                    <div className="border-t border-zinc-900/60 pt-3 flex flex-col gap-1.5 text-[10px] text-zinc-500">
                      {contact.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-zinc-650" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-zinc-650" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.notes && (
                        <p className="text-[9px] text-zinc-600 border-t border-zinc-950 pt-2 mt-1 leading-normal">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Comments Thread */}
        {activeTab === 'comments' && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <h3 className="text-sm font-bold text-zinc-300">Hilo de Comentarios</h3>

            {/* Post comment box */}
            <form onSubmit={handleSendComment} className="flex gap-3 bg-zinc-950 border border-zinc-900 p-3 rounded-2xl">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario o mensaje en esta ficha de cliente..."
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-xl px-4 py-2 text-xs outline-none focus:border-zinc-700"
              />
              <Button type="submit" disabled={!commentText.trim()} leftIcon={<Send className="w-3.5 h-3.5" />} className="h-10">
                Enviar
              </Button>
            </form>

            {/* Comments List */}
            <div className="flex flex-col gap-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-600">Aún no hay comentarios.</div>
              ) : (
                comments.map((comment: any) => (
                  <div key={comment._id} className="bg-zinc-950 border border-zinc-900/60 p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-zinc-300">{comment.user?.name || 'Usuario'}</span>
                      <span className="text-zinc-600">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-zinc-450 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Activity Audit Log */}
        {activeTab === 'timeline' && (
          <div className="flex flex-col gap-6 max-w-2xl">
            <h3 className="text-sm font-bold text-zinc-300">Historial de Actividad</h3>
            
            <div className="relative border-l border-zinc-900 pl-6 flex flex-col gap-6 ml-2">
              {events.length === 0 ? (
                <div className="text-zinc-600 text-xs">Sin actividad registrada todavía.</div>
              ) : (
                events.map((event: any) => (
                  <div key={event._id} className="relative">
                    {/* Circle Node */}
                    <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-purple border-2 border-zinc-950" />
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-600">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                      <p className="text-xs font-bold text-zinc-300">
                        {event.action}
                      </p>
                      {event.detail && (
                        <p className="text-[10px] text-zinc-550 leading-normal">
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title="Agregar Contacto">
        <form onSubmit={handleAddContact} className="flex flex-col gap-4">
          <Input
            label="Nombre Completo (Obligatorio)"
            placeholder="ej. Juan Gómez"
            value={newContact.name}
            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
          />

          <Input
            label="Cargo / Puesto (Opcional)"
            placeholder="ej. Gerente de Compras"
            value={newContact.role}
            onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              placeholder="ej. juan@empresa.com"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            />
            <Input
              label="Teléfono"
              placeholder="ej. +34 600000001"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
          </div>

          <Input
            label="Notas / Observaciones"
            placeholder="ej. Disponible por las mañanas..."
            value={newContact.notes}
            onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsContactModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateClientMutation.isPending}>
              Guardar Contacto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ClientDetailPage;
