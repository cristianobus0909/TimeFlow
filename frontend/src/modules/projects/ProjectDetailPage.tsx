import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  User,
  Clock,
  ArrowLeft,
  Settings,
  AlertCircle,
  GripVertical,
} from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Modal } from '@shared/components/Modal';
import { Input } from '@shared/components/Input';
import { timerStore } from '@/store/timerStore';
import { toastStore } from '@/store/toastStore';

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = toastStore();
  const { startTimer, isRunning, setCompact } = timerStore();
  
  const [isAddTasksOpen, setIsAddTasksOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [projectTab, setProjectTab] = useState<'tasks' | 'comments' | 'timeline'>('tasks');
  const [newComment, setNewComment] = useState('');

  // Edit Project States
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editColor, setEditColor] = useState('#10B981');
  const [editNotes, setEditNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Invalidate queries when a timer session logs in the background
  useEffect(() => {
    const handleReload = () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['project-health', id] });
    };
    window.addEventListener('session-logged', handleReload);
    return () => window.removeEventListener('session-logged', handleReload);
  }, [queryClient, id]);

  // Fetch Project Details
  const { data: projectData, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`),
    enabled: !!id,
  });

  // Fetch Project Health
  const { data: health } = useQuery({
    queryKey: ['project-health', id],
    queryFn: () => api.get(`/projects/${id}/health`),
    enabled: !!id,
  });

  // Query Comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', 'PROJECT', id],
    queryFn: () => api.get(`/comments?refType=PROJECT&refId=${id}`),
    enabled: !!id && projectTab === 'comments',
  });

  // Query Timeline
  const { data: events = [] } = useQuery({
    queryKey: ['timeline', 'PROJECT', id],
    queryFn: () => api.get(`/timeline?refType=PROJECT&refId=${id}`),
    enabled: !!id && projectTab === 'timeline',
  });

  const project = projectData?.project;
  const projectTasks = projectData?.tasks || [];

  // Populate Edit Form States when project details load
  useEffect(() => {
    if (project) {
      setEditName(project.name || '');
      setEditDescription(project.description || '');
      setEditClient(project.client || '');
      setEditPriority(project.priority || 'medium');
      setEditStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
      setEditEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
      setEditColor(project.color || '#10B981');
      setEditNotes(project.notes || '');
    }
  }, [project]);

  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: (values: any) => api.put(`/projects/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      showToast('Proyecto actualizado con éxito.');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al actualizar el proyecto.', 'error');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) =>
      api.post('/comments', { refType: 'PROJECT', refId: id, content: text }),
    onSuccess: () => {
      setNewComment('');
      refetchComments();
      showToast('Comentario añadido.');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al enviar el comentario.', 'error');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      showToast('Proyecto eliminado con éxito.');
      navigate('/projects');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al eliminar el proyecto.', 'error');
    },
  });

  const handleStartProject = () => {
    const firstPending = projectTasks.find((pt: any) => pt.status === 'pending');
    if (!firstPending) {
      showToast('No hay tareas pendientes en este proyecto.', 'info');
      return;
    }

    if (isRunning) {
      showToast('Ya hay un temporizador corriendo. Detenlo antes de iniciar.', 'error');
      return;
    }

    startTimer(
      firstPending.taskId._id,
      id!,
      firstPending.taskId.name,
      firstPending.taskId.color,
      firstPending._id
    );
    showToast(`Temporizador iniciado para: ${firstPending.taskId.name}`);
    setCompact(true);
  };

  // Fetch All Tasks (to let user add them to the project)
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks'),
    enabled: isAddTasksOpen,
  });

  // Mutations
  const addTaskMutation = useMutation({
    mutationFn: ({ taskId, quantity }: { taskId: string; quantity: number }) =>
      api.post(`/projects/${id}/tasks`, { taskId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      showToast('Tarea agregada al proyecto.');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al agregar la tarea.', 'error');
    },
  });

  const removeTaskMutation = useMutation({
    mutationFn: (projectTaskId: string) => api.delete(`/projects/${id}/tasks/${projectTaskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      showToast('Tarea removida del proyecto.');
    },
  });

  const toggleTaskStatusMutation = useMutation({
    mutationFn: ({ projectTaskId, status }: { projectTaskId: string; status: 'pending' | 'completed' }) =>
      api.put(`/projects/${id}/tasks/${projectTaskId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: (taskOrders: { projectTaskId: string; order: number }[]) =>
      api.put(`/projects/${id}/tasks/reorder`, { taskOrders }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // Reorder local tasks list optimistically
    const reordered = [...projectTasks];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    // Map new order numbers
    const newOrders = reordered.map((item, index) => ({
      projectTaskId: item._id,
      order: index,
    }));

    // Trigger update on DB
    reorderTasksMutation.mutate(newOrders);
    setDraggedIndex(null);
  };

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-4 animate-bounce" />
        <h3 className="font-bold text-zinc-300">Proyecto no encontrado</h3>
        <p className="text-xs">El proyecto solicitado no existe o no tienes acceso.</p>
        <Link to="/projects" className="mt-4">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver a proyectos
          </Button>
        </Link>
      </div>
    );
  }

  if (projectLoading || !project) {
    return (
      <div className="flex flex-col gap-6 animate-pulse select-none">
        <div className="h-6 bg-zinc-900 border border-zinc-800 rounded-xl w-32" />
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Allow all tasks to be addable since we support duplicate tasks inside projects
  const addableTasks = allTasks;

  return (
    <div className="flex flex-col gap-8 select-text">
      {/* Back button */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a Proyectos
        </Link>
      </div>

      {/* Project Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: project.color }} />
            <h2 className="text-2xl font-bold text-zinc-100 font-display">{project.name}</h2>
          </div>
          {project.client && (
            <span className="text-xs text-zinc-500 font-semibold mt-1 block">Cliente: {project.client}</span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          {projectTasks.length > 0 && (
            <Button
              onClick={handleStartProject}
              className="bg-brand-emerald hover:bg-brand-emerald-hover text-white shadow-lg shadow-brand-emerald/20 border-transparent"
              leftIcon={<Play className="w-4 h-4 fill-white/10" />}
            >
              Iniciar Proyecto
            </Button>
          )}
          <Button
            onClick={() => setIsEditOpen(true)}
            variant="secondary"
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Editar Proyecto
          </Button>
          <Button onClick={() => setIsAddTasksOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Agregar Tareas
          </Button>
        </div>
      </div>

      {/* Estimations Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <Card hoverable>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
            Total Estimado
          </span>
          <p className="text-xl font-bold text-zinc-200">{formatHours(project.estimatedDuration)}</p>
          <span className="text-[9px] text-zinc-500 mt-1 block">Suma de promedios ponderados</span>
        </Card>

        <Card hoverable>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
            Tiempo Real Trabajado
          </span>
          <p className="text-xl font-bold text-emerald-400">{formatHours(project.accumulatedDuration)}</p>
          <span className="text-[9px] text-zinc-500 mt-1 block">Minutos cronometrados</span>
        </Card>

        <Card hoverable>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
            Tiempo Restante
          </span>
          <p className="text-xl font-bold text-zinc-200">{formatHours(project.remainingDuration)}</p>
          <span className="text-[9px] text-zinc-500 mt-1 block">Estimación restante</span>
        </Card>

        <Card hoverable>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
            Porcentaje Completado
          </span>
          <p className="text-xl font-bold text-zinc-200">{project.completionPercentage}%</p>
          <div className="h-1.5 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden p-0.5 mt-2">
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: project.color, width: `${project.completionPercentage}%` }}
            />
          </div>
        </Card>

        <Card hoverable className="relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
              Salud del Proyecto
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${
                health?.status === 'RED' ? 'bg-rose-500 animate-pulse' :
                health?.status === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <p className="text-sm font-black text-zinc-200">
                {health?.label || 'Excelente'}
              </p>
            </div>
            {health?.reasons && health.reasons.length > 0 && (
              <p className="text-[9px] text-zinc-550 mt-2 leading-relaxed">
                {health.reasons[0]}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Main planner grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project main content column (conditional tabs) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tab Selectors */}
          <div className="flex border-b border-zinc-900/60 pb-px gap-1 overflow-x-auto">
            <button
              onClick={() => setProjectTab('tasks')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                projectTab === 'tasks' ? 'border-brand-purple text-zinc-200 bg-brand-purple/5' : 'border-transparent text-zinc-550 hover:text-zinc-300'
              }`}
            >
              Planificador de Tareas
            </button>
            <button
              onClick={() => setProjectTab('comments')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                projectTab === 'comments' ? 'border-brand-purple text-zinc-200 bg-brand-purple/5' : 'border-transparent text-zinc-550 hover:text-zinc-300'
              }`}
            >
              Comentarios
            </button>
            <button
              onClick={() => setProjectTab('timeline')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                projectTab === 'timeline' ? 'border-brand-purple text-zinc-200 bg-brand-purple/5' : 'border-transparent text-zinc-550 hover:text-zinc-300'
              }`}
            >
              Actividad
            </button>
          </div>

          {projectTab === 'tasks' && (
            <Card className="flex flex-col justify-between flex-grow">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 mb-1">Planificador de Tareas</h3>
                <p className="text-[10px] text-zinc-500 mb-6">
                  Arrastra y ordena las tareas. Al reordenar, se autocalculan los tiempos restantes.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 flex-grow">
                {projectTasks.map((pt: any, index: number) => (
                  <div
                    key={pt._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-xs select-none ${
                      pt.status === 'completed'
                        ? 'bg-zinc-950/20 border-zinc-900/60 text-zinc-500'
                        : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800/80 text-zinc-300 hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-0.5">
                        <GripVertical className="w-4 h-4 flex-shrink-0" />
                      </div>
                      <button
                        onClick={() =>
                          toggleTaskStatusMutation.mutate({
                            projectTaskId: pt._id,
                            status: pt.status === 'completed' ? 'pending' : 'completed',
                          })
                        }
                        className="p-0.5 hover:scale-105 transition-transform text-zinc-600 hover:text-emerald-400 cursor-pointer flex items-center justify-center"
                      >
                        <CheckCircle className={`w-4 h-4 ${pt.status === 'completed' ? 'text-emerald-400 fill-emerald-400/10' : ''}`} />
                      </button>
                      <div className="flex flex-col text-left truncate">
                        <span className={`font-semibold truncate ${pt.status === 'completed' ? 'line-through' : ''}`}>
                          {pt.taskId?.name || pt.taskId?.title || 'Tarea'}
                        </span>
                        <span className="text-[9px] text-zinc-500 truncate mt-0.5">
                          Promedio: {formatHours(pt.taskId?.averageDuration || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {pt.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (isRunning) {
                              showToast('Ya hay un cronómetro activo.', 'error');
                              return;
                            }
                            startTimer(pt.taskId._id, id!, pt.taskId.name || pt.taskId.title, pt.taskId.color, pt._id);
                            showToast(`Temporizador iniciado para: ${pt.taskId.name || pt.taskId.title}`);
                          }}
                          leftIcon={<Play className="w-3 h-3 fill-current" />}
                        >
                          Iniciar
                        </Button>
                      )}
                      {pt.status === 'completed' && (
                        <span className="font-mono text-[10px] text-zinc-500">
                          Real: {formatHours(pt.actualDuration)}
                        </span>
                      )}
                      <button
                        onClick={() => removeTaskMutation.mutate(pt._id)}
                        className="p-1.5 text-zinc-700 hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {projectTasks.length === 0 && (
                  <div className="py-16 text-center text-xs text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                    Aún no has agregado tareas a este proyecto.
                  </div>
                )}
              </div>
            </Card>
          )}

          {projectTab === 'comments' && (
            <Card className="flex flex-col gap-4 flex-grow">
              <h3 className="text-sm font-bold text-zinc-200">Comentarios del Proyecto</h3>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newComment.trim()) return;
                  addCommentMutation.mutate(newComment);
                }}
                className="flex gap-3 bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl"
              >
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario sobre el proyecto..."
                  className="w-full bg-zinc-900 border border-zinc-850 text-zinc-200 placeholder:text-zinc-650 rounded-xl px-4 py-2 text-xs outline-none focus:border-zinc-750"
                />
                <Button type="submit" disabled={!newComment.trim()} className="h-9">
                  Enviar
                </Button>
              </form>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[45vh] pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-600">Aún no hay comentarios en este proyecto.</div>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment._id} className="bg-zinc-950 border border-zinc-900/60 p-3 rounded-xl flex flex-col gap-1 text-left">
                      <div className="flex justify-between items-center text-[9px] text-zinc-550">
                        <span className="font-bold text-zinc-300">{comment.user?.name || 'Usuario'}</span>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {projectTab === 'timeline' && (
            <Card className="flex flex-col gap-4 flex-grow">
              <h3 className="text-sm font-bold text-zinc-200">Historial del Proyecto</h3>
              
              <div className="relative border-l border-zinc-900 pl-6 flex flex-col gap-5 ml-2 overflow-y-auto max-h-[50vh] pr-1 text-left">
                {events.length === 0 ? (
                  <div className="text-zinc-650 text-xs py-4">Sin actividad registrada todavía.</div>
                ) : (
                  events.map((event: any) => (
                    <div key={event._id} className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-brand-purple border border-zinc-950" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-zinc-600">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                        <p className="text-xs font-bold text-zinc-350">{event.action}</p>
                        {event.detail && (
                          <p className="text-[10px] text-zinc-500 leading-normal">{event.detail}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Project info card details */}
        <Card className="flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 mb-1">Detalles del Proyecto</h3>
            <p className="text-[10px] text-zinc-500 mb-6">Detalles comerciales y cronología</p>
            
            <div className="flex flex-col gap-4 text-xs font-semibold text-zinc-400">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-500" />
                <div>
                  <span className="text-[9px] uppercase text-zinc-600 block">Cliente</span>
                  <span className="text-zinc-300">{project.client || 'Sin cliente asignado'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <div>
                  <span className="text-[9px] uppercase text-zinc-600 block">Fechas</span>
                  <span className="text-zinc-300">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/D'} -{' '}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/D'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Notas del Proyecto</h4>
            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-900 min-h-[100px] whitespace-pre-wrap">
              {project.notes || 'Sin anotaciones adicionales.'}
            </p>
          </div>
        </Card>
      </div>

      {/* Add Tasks Modal */}
      <Modal isOpen={isAddTasksOpen} onClose={() => setIsAddTasksOpen(false)} title="Agregar Tareas al Proyecto">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500 mb-4">
            Selecciona de tu lista de tareas repetitivas para incorporarlas al presupuesto estimado de este proyecto.
          </p>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {addableTasks.map((t: any) => {
              const qty = quantities[t._id] || 1;
              return (
                <div
                  key={t._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-900 text-xs font-semibold text-zinc-300 w-full"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </span>

                  <div className="flex items-center gap-2.5">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-7">
                      <button
                        type="button"
                        onClick={() => setQuantities({ ...quantities, [t._id]: Math.max(1, qty - 1) })}
                        className="px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 h-full font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-mono text-[11px] text-zinc-200">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantities({ ...quantities, [t._id]: qty + 1 })}
                        className="px-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 h-full font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => addTaskMutation.mutate({ taskId: t._id, quantity: qty })}
                      className="text-[10px] text-brand-purple bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple hover:text-white px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              );
            })}

            {addableTasks.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-600">
                No hay más tareas disponibles para agregar. Crea nuevas tareas en el Gestor de Tareas.
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button variant="secondary" onClick={() => setIsAddTasksOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Proyecto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProjectMutation.mutate({
              name: editName,
              description: editDescription,
              client: editClient,
              priority: editPriority,
              startDate: editStartDate,
              endDate: editEndDate,
              color: editColor,
              notes: editNotes,
            });
          }}
          className="flex flex-col gap-4 text-xs"
        >
          <Input
            label="Nombre del Proyecto"
            placeholder="ej. Rediseño Web Corporativa, Desarrollo App Móvil..."
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <Input
            label="Descripción"
            placeholder="ej. Planificación de hitos, maquetación y pruebas de integración..."
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cliente"
              placeholder="ej. ACME Corp"
              value={editClient}
              onChange={(e) => setEditClient(e.target.value)}
            />

            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Prioridad</span>
              <select
                className="bg-zinc-900 border border-zinc-800 focus:border-brand-purple text-zinc-100 rounded-xl px-3 py-2 text-xs outline-none w-full"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha Inicio"
              type="date"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
            />
            <Input
              label="Fecha Entrega"
              type="date"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
            />
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Color del Proyecto</span>
            <div className="flex gap-2.5 flex-wrap">
              {['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899', '#7C3AED'].map((c) => (
                <label key={c} className="w-7 h-7 rounded-full cursor-pointer relative" style={{ backgroundColor: c }}>
                  <input
                    type="radio"
                    name="editColor"
                    value={c}
                    checked={editColor === c}
                    onChange={() => setEditColor(c)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className={`absolute inset-0 rounded-full border-2 border-white transition-opacity ${editColor === c ? 'opacity-100' : 'opacity-0 hover:opacity-40'}`} />
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Notas"
            placeholder="ej. Notas comerciales o links importantes..."
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />

          <div className="flex justify-between items-center mt-6">
            {/* Delete Trigger */}
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsDeleteConfirmOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar Proyecto
            </Button>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={updateProjectMutation.isPending}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="¿Eliminar Proyecto?">
        <div className="flex flex-col gap-4 text-xs text-left">
          <div className="flex items-center gap-3 p-3 bg-rose-955/20 border border-rose-900/40 text-rose-400 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold leading-relaxed">
              Esta acción eliminará de forma permanente el proyecto y todas sus tareas estimadas y métricas. Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              isLoading={deleteProjectMutation.isPending}
              onClick={() => {
                deleteProjectMutation.mutate();
                setIsDeleteConfirmOpen(false);
                setIsEditOpen(false);
              }}
            >
              Confirmar Eliminación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ProjectDetailPage;
