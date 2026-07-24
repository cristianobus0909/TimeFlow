import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Play,
  Pause,
  Square,
  X,
  Star,
  Plus,
  Trash2,
  Bookmark,
  Volume2,
  VolumeX,
  Keyboard,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Input } from '@shared/components/Input';
import { Modal } from '@shared/components/Modal';
import { timerStore } from '@/store/timerStore';
import { toastStore } from '@/store/toastStore';
import { settingsStore } from '@/store/settingsStore';

const taskSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es obligatoria'),
  color: z.string().min(1, 'El color es obligatorio'),
  icon: z.string().default('Clock'),
  project: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export const TasksPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = toastStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Active Timer Store state
  const {
    activeTaskId,
    activeTaskName,
    activeTaskColor,
    isRunning,
    isPaused,
    seconds,
    notes,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    cancelTimer,
    setNotes,
    tick,
  } = timerStore();

  // Load user settings to respect keybinds or sound alerts
  const { settings } = settingsStore();

  // Fetch Tasks List
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks'),
  });

  // Fetch Projects List (to link them to tasks)
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Estado de la tarea actualizado con éxito.');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar el estado.', 'error');
    }
  };

  const columns = [
    { key: 'TODO', name: 'Pendientes', color: 'border-zinc-800' },
    { key: 'IN_PROGRESS', name: 'En Progreso', color: 'border-blue-500/30' },
    { key: 'BLOCKED', name: 'Bloqueadas', color: 'border-rose-500/30' },
    { key: 'DONE', name: 'Finalizadas', color: 'border-emerald-500/30' },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      category: 'General',
      color: '#7C3AED',
      icon: 'Clock',
    },
  });

  // Hotkey listener inside timer mode
  useEffect(() => {
    const handleTimerHotkeys = (e: KeyboardEvent) => {
      if (!isRunning) return;

      // Ignore if user is writing in the notes input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPaused) resumeTimer();
        else pauseTimer();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleStopTimer();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (window.confirm('¿Está seguro de que desea cancelar esta sesión? No se guardará ningún tiempo.')) {
          cancelTimer();
          showToast('Sesión cancelada.', 'info');
        }
      }
    };

    window.addEventListener('keydown', handleTimerHotkeys);
    return () => window.removeEventListener('keydown', handleTimerHotkeys);
  }, [isRunning, isPaused, resumeTimer, pauseTimer]);

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (values: TaskFormValues) => api.post('/tasks', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Tarea creada correctamente.');
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al crear la tarea.', 'error');
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast(data.message || 'Tarea eliminada.');
    },
    onError: (err: any) => {
      showToast(err.message || 'Error al eliminar la tarea.', 'error');
    },
  });

  const handleCreateTask = (values: TaskFormValues) => {
    createTaskMutation.mutate(values);
  };

  const handleStopTimer = async () => {
    try {
      const timerData = await stopTimer();
      if (!timerData) return;

      // Play final sound notification if enabled
      if (soundEnabled && settings.soundAlerts) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
          audio.volume = 0.5;
          audio.play();
        } catch (e) {
          console.warn('Audio play error:', e);
        }
      }

      showToast('Sesión guardada con éxito.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      showToast(error.message || 'Error al guardar la sesión.', 'error');
    }
  };

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs === 0 && mins === 0) return `${secs}s`;
    if (hrs === 0) return `${mins}m ${secs}s`;
    return `${hrs}h ${mins}m`;
  };

  const formatTimeFull = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 select-none">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-48 animate-pulse" />
          <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-36 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 select-text">
      {/* IMMERSIVE TIMER OVERLAY (When running) */}
      {isRunning && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col justify-between p-12">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between w-full max-w-4xl mx-auto border-b border-zinc-900 pb-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: activeTaskColor }} />
              <div className="text-left">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Cronometrando Tarea</span>
                <h2 className="text-base font-bold text-zinc-100">{activeTaskName}</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800/80 cursor-pointer"
                title={soundEnabled ? 'Silenciar alertas' : 'Activar alertas'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {/* Cancel Button */}
              <button
                onClick={() => {
                  if (window.confirm('¿Está seguro de que desea cancelar esta sesión? No se guardará ningún tiempo.')) {
                    cancelTimer();
                    showToast('Sesión cancelada.', 'info');
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-950 bg-rose-950/20 text-rose-400 hover:bg-rose-950/30 transition-all text-xs font-semibold cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>

          {/* Center Digital Clock Area */}
          <div className="flex flex-col items-center justify-center relative flex-grow my-8 select-none">
            {/* Visual Pulse Animation */}
            <div
              className={`absolute w-72 h-72 rounded-full border border-zinc-800/40 pointer-events-none ${
                !isPaused ? 'animate-pulse-ring' : ''
              }`}
              style={{ borderColor: `${activeTaskColor}1A`, boxShadow: `0 0 50px -5px ${activeTaskColor}0D` }}
            />
            
            <span className="font-mono text-7xl md:text-8xl font-black text-zinc-100 tracking-tight z-10">
              {formatTimeFull(seconds)}
            </span>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4">
              {isPaused ? 'Pausado' : 'Corriendo'}
            </span>
          </div>

          {/* Bottom Notes & Action controls */}
          <div className="w-full max-w-xl mx-auto flex flex-col gap-6 items-center">
            {/* Note text field */}
            <div className="w-full">
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe aquí observaciones o detalles de lo que haces..."
                className="w-full text-center bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-zinc-200 placeholder:text-zinc-600 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-zinc-800/50"
              />
            </div>

            {/* Run Controls */}
            <div className="flex items-center gap-4">
              {isPaused ? (
                <Button size="lg" className="w-40" onClick={resumeTimer} leftIcon={<Play className="w-4 h-4" />}>
                  Reanudar
                </Button>
              ) : (
                <Button size="lg" className="w-40" variant="secondary" onClick={pauseTimer} leftIcon={<Pause className="w-4 h-4" />}>
                  Pausar
                </Button>
              )}
              <Button size="lg" className="w-40" variant="primary" onClick={handleStopTimer} leftIcon={<Square className="w-4 h-4" />}>
                Guardar y Cerrar
              </Button>
            </div>

            {/* Keyboard Shortcuts cues */}
            <div className="flex items-center gap-6 text-[10px] text-zinc-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5" />
                <span className="bg-zinc-900 px-1 rounded border border-zinc-800 font-mono">Espacio</span> Pausa
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-zinc-900 px-1 rounded border border-zinc-800 font-mono">Esc</span> Cancelar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-zinc-900 px-1 rounded border border-zinc-800 font-mono">S</span> Guardar
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header section of page */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-display">Tus Tareas</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Administra tus actividades y mide tiempos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'kanban' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Kanban
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Nueva Tarea
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t: any) => {
              const s = t.status?.toUpperCase() || 'TODO';
              if (col.key === 'TODO') return s === 'TODO' || s === 'ACTIVE';
              if (col.key === 'DONE') return s === 'DONE' || s === 'COMPLETED';
              return s === col.key;
            });

            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.key)}
                className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-4 min-h-[50vh] transition-all"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      col.key === 'TODO' ? 'bg-zinc-500' :
                      col.key === 'IN_PROGRESS' ? 'bg-blue-400' :
                      col.key === 'BLOCKED' ? 'bg-rose-400' : 'bg-emerald-400'
                    }`} />
                    <span className="text-xs font-bold text-zinc-300">{col.name}</span>
                  </div>
                  <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[55vh] pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
                      Arrastra tareas aquí
                    </div>
                  ) : (
                    colTasks.map((task: any) => {
                      const checklistCount = task.checklist?.length || 0;
                      const checklistCompleted = task.checklist?.filter((c: any) => c.completed).length || 0;

                      return (
                        <div
                          key={task._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task._id)}
                          className="bg-zinc-900/60 border border-zinc-850 hover:border-zinc-800/80 p-3 rounded-xl flex flex-col gap-3 cursor-grab active:cursor-grabbing relative group select-none transition-all"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: task.color }} />
                          
                          <div>
                            <div className="flex justify-between items-center gap-2 mb-1.5">
                              <span className="text-[9px] bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded-md font-semibold text-zinc-400 truncate">
                                {task.category}
                              </span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 rounded ${
                                task.priority === 'HIGH' ? 'bg-rose-950/20 text-rose-400' :
                                task.priority === 'MEDIUM' ? 'bg-amber-950/20 text-amber-400' :
                                'bg-zinc-850 text-zinc-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">{task.name || task.title}</h4>
                            {task.description && (
                              <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-normal">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {checklistCount > 0 && (
                            <div className="flex items-center justify-between text-[9px] text-zinc-500">
                              <span>Checklist:</span>
                              <span className="font-bold text-zinc-400">{checklistCompleted}/{checklistCount}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-zinc-850/50 pt-2">
                            <span className="text-[9px] text-zinc-500 font-mono">
                              Avg: {formatHours(task.averageDuration)}
                            </span>
                            <button
                              onClick={() => {
                                startTimer(task._id, null, task.name, task.color);
                                showToast(`Temporizador iniciado: ${task.name}`);
                              }}
                              className="bg-brand-purple hover:bg-brand-purple-hover text-white p-1 rounded-md transition-all cursor-pointer flex items-center justify-center"
                              title="Iniciar sesión"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task: any) => (
            <Card key={task._id} hoverable className="flex flex-col justify-between gap-6 relative group">
              <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: task.color }} />

              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <Bookmark className="w-4 h-4 flex-shrink-0" style={{ color: task.color }} />
                    <span className="text-[10px] bg-zinc-950 border border-zinc-800/80 px-2 py-0.5 rounded-full font-semibold text-zinc-400">
                      {task.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavoriteMutation.mutate(task._id)}
                      className="p-1 text-zinc-600 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${task.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Está seguro de que desea eliminar esta tarea? Se mantendrá en el historial pero se archivará.')) {
                          deleteTaskMutation.mutate(task._id);
                        }
                      }}
                      className="p-1 text-zinc-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-zinc-200 mb-1">{task.name || task.title}</h3>
                {task.description && (
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{task.description}</p>
                )}
              </div>

              <div className="border-t border-zinc-800/80 pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> Promedio Ponderado
                  </span>
                  <span className="text-zinc-200 font-bold">{formatHours(task.averageDuration)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[9px] font-semibold text-zinc-500 text-center">
                  <div className="bg-zinc-950 border border-zinc-900/50 p-2 rounded-xl">
                    <span>Mínimo:</span>
                    <p className="text-zinc-300 font-bold mt-0.5">{formatHours(task.minDuration)}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900/50 p-2 rounded-xl">
                    <span>Máximo:</span>
                    <p className="text-zinc-300 font-bold mt-0.5">{formatHours(task.maxDuration)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 border-t border-zinc-900/50 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Confianza</span>
                    <span
                      className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        task.confidenceLevel === 'high'
                          ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-950'
                          : task.confidenceLevel === 'medium'
                          ? 'bg-amber-950/20 text-amber-400 border border-amber-950'
                          : 'bg-rose-950/20 text-rose-400 border border-rose-950'
                      }`}
                    >
                      {task.confidenceLevel === 'high' ? 'Alta' : task.confidenceLevel === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      startTimer(task._id, null, task.name, task.color);
                      showToast(`Temporizador iniciado para: ${task.name}`);
                    }}
                    leftIcon={<Play className="w-3 h-3 fill-current" />}
                  >
                    Iniciar
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {tasks.length === 0 && (
            <div className="col-span-full py-16 text-center text-xs text-zinc-600 border border-dashed border-zinc-800 rounded-3xl">
              Aún no has creado ninguna tarea. Haz clic en "Nueva Tarea" para empezar.
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nueva Tarea">
        <form onSubmit={handleSubmit(handleCreateTask)} className="flex flex-col gap-4">
          <Input
            label="Nombre de la Tarea"
            placeholder="ej. Escribir tests unitarios, Maquetar landing page..."
            error={errors.name?.message as string}
            {...register('name')}
          />

          <Input
            label="Descripción (Opcional)"
            placeholder="ej. Tarea repetitiva de QA y estructurado de componentes..."
            error={errors.description?.message as string}
            {...register('description')}
          />

          <Input
            label="Categoría"
            placeholder="ej. Desarrollo, QA, Diseño, Reunión..."
            error={errors.category?.message as string}
            {...register('category')}
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Proyecto Asociado (Opcional)</label>
            <select
              {...register('project')}
              className="w-full bg-zinc-900 border border-zinc-850 text-zinc-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-zinc-700"
            >
              <option value="">Sin Proyecto</option>
              {projects.map((proj: any) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Color Visual</span>
            <div className="flex gap-2.5 flex-wrap">
              {['#7C3AED', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899'].map((c) => (
                <label key={c} className="w-7 h-7 rounded-full cursor-pointer relative" style={{ backgroundColor: c }}>
                  <input
                    type="radio"
                    value={c}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                    {...register('color')}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-white opacity-0 hover:opacity-40" />
                </label>
              ))}
            </div>
            {errors.color && <span className="text-xs text-rose-500">{errors.color.message as string}</span>}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createTaskMutation.isPending}>
              Guardar Tarea
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TasksPage;
