import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { toastStore } from '../../store/toastStore';

export const HistoryPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = toastStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [newNotes, setNewNotes] = useState('');

  // Fetch Time Sessions
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions?limit=200'), // fetch up to 200 history logs
  });

  const sessions = data?.sessions || [];

  // Mutations
  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      showToast('Sesión de tiempo eliminada.');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al eliminar la sesión.', 'error');
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.put(`/sessions/${id}/notes`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      showToast('Observaciones actualizadas con éxito.');
      setIsEditOpen(false);
      setEditingSession(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al actualizar observaciones.', 'error');
    },
  });

  const handleEditClick = (session: any) => {
    setEditingSession(session);
    setNewNotes(session.notes || '');
    setIsEditOpen(true);
  };

  const handleUpdateNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    updateNotesMutation.mutate({ id: editingSession._id, notes: newNotes });
  };

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    if (sessions.length === 0) {
      showToast('No hay registros en el historial para exportar.', 'error');
      return;
    }

    const headers = 'Fecha,Hora Inicio,Hora Fin,Tarea,Categoria,Proyecto,Duracion (Segundos),Notas\n';
    
    const rows = sessions.map((s: any) => {
      const date = new Date(s.startTime).toLocaleDateString();
      const startTime = new Date(s.startTime).toLocaleTimeString();
      const endTime = new Date(s.endTime).toLocaleTimeString();
      const taskName = s.taskId?.name || 'Tarea Eliminada';
      const category = s.taskId?.category || 'General';
      const projectName = s.projectId?.name || 'Individual';
      const duration = s.duration;
      const notesClean = (s.notes || '').replace(/"/g, '""');

      return `"${date}","${startTime}","${endTime}","${taskName}","${category}","${projectName}",${duration},"${notesClean}"`;
    }).join('\n');

    const csvContent = '\uFEFF' + headers + rows; // Add UTF-8 BOM for Excel support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timeflow_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Historial exportado a CSV.');
  };

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs === 0 && mins === 0) return `${secs}s`;
    if (hrs === 0) return `${mins}m ${secs}s`;
    return `${hrs}h ${mins}m`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter sessions based on search & category select inputs
  const filteredSessions = sessions.filter((s: any) => {
    const matchesSearch =
      (s.taskId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === '' || s.taskId?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories for filters dropdown
  const categories = Array.from(
    new Set<string>(sessions.map((s: any) => s.taskId?.category).filter(Boolean))
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 select-none animate-pulse">
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-48" />
        <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl w-full" />
        <div className="h-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 select-text">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-display">Historial de Tiempos</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Consulta y gestiona las sesiones de tiempo registradas</p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
          Exportar a CSV
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre de tarea u observaciones..."
            className="w-full bg-zinc-950 border border-zinc-900 focus:border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-zinc-800/30"
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto flex-shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-900 text-zinc-400 rounded-xl px-4 py-2.5 text-xs outline-none"
          >
            <option value="">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* History Data Table */}
      <Card className="overflow-hidden p-0 border-zinc-900 bg-zinc-950/40">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-zinc-300">
            <thead>
              <tr className="bg-zinc-950/80">
                <th className="tf-table-th">Fecha</th>
                <th className="tf-table-th">Tarea</th>
                <th className="tf-table-th">Proyecto</th>
                <th className="tf-table-th">Duración</th>
                <th className="tf-table-th">Observaciones</th>
                <th className="tf-table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {filteredSessions.map((session: any) => (
                <tr key={session._id} className="tf-table-tr">
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                    <span className="block font-semibold">{formatDate(session.startTime)}</span>
                    <span className="text-[10px] text-zinc-600 mt-0.5 block">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: session.taskId?.color || '#7C3AED' }}
                      />
                      <span className="font-bold text-zinc-200">
                        {session.taskId?.name || 'Tarea Eliminada'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {session.projectId ? (
                      <span className="text-[10px] bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                        {session.projectId.name}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">Individual</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-100 font-bold">
                    {formatHours(session.duration)}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-zinc-400">
                    {session.notes || <span className="text-zinc-700 italic">Sin observaciones</span>}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(session)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
                        title="Editar observaciones"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('¿Está seguro de que desea eliminar permanentemente este registro del historial?')) {
                            deleteSessionMutation.mutate(session._id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-700 hover:text-rose-500 hover:bg-rose-950/20 cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-600">
                    No se encontraron registros de tiempo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Observations Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Observaciones de Sesión">
        <form onSubmit={handleUpdateNotes} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Observaciones de la Sesión</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Añade aquí notas sobre la tarea realizada..."
              className="bg-zinc-950 border border-zinc-900 focus:border-zinc-800 text-zinc-200 placeholder:text-zinc-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-800/40 min-h-[100px] resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={updateNotesMutation.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default HistoryPage;
