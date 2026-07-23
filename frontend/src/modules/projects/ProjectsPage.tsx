import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Folder, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';
import { Input } from '@shared/components/Input';
import { Modal } from '@shared/components/Modal';
import { toastStore } from '@/store/toastStore';
import { authStore } from '@/store/authStore';

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  priority: z.string().default('medium'),
  client: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  color: z.string().default('#10B981'),
  notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = toastStore();
  const { user } = authStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Projects List
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      priority: 'medium',
      color: '#10B981',
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (values: ProjectFormValues) => api.post('/projects', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Proyecto creado con éxito.');
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      // Check if limits exceeded for SaaS Free tier
      if (err.message?.includes('Límite de proyectos')) {
        showToast('Has alcanzado el límite del plan gratuito. ¡Haz upgrade a Pro!', 'error');
      } else {
        showToast(err.message || 'Error al crear el proyecto.', 'error');
      }
    },
  });

  const handleCreateProject = (values: ProjectFormValues) => {
    createProjectMutation.mutate(values);
  };

  const formatHours = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high':
        return 'tf-badge-danger';
      case 'low':
        return 'text-zinc-500 bg-zinc-950 border border-zinc-900/60 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase';
      case 'medium':
      default:
        return 'text-blue-400 bg-blue-950/20 border border-blue-900/50 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'in_progress':
        return 'En progreso';
      case 'completed':
        return 'Completado';
      case 'paused':
        return 'Pausado';
      case 'planning':
      default:
        return 'Planificación';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 select-none">
        <div className="flex justify-between items-center">
          <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-48 animate-pulse" />
          <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-36 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-52 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 select-text">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 font-display">Tus Proyectos</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Planifica estimaciones de tiempos basadas en tareas reales</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Crear Proyecto
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project: any) => (
          <Card key={project._id} hoverable className="relative flex flex-col justify-between gap-6 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: project.color }} />

            <div>
              {/* Client & Priority headers */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <span className="tf-badge">
                  {getStatusLabel(project.status)}
                </span>
                <span className={getPriorityColor(project.priority)}>
                  {project.priority === 'high' ? 'Alta' : project.priority === 'low' ? 'Baja' : 'Media'}
                </span>
              </div>

              {/* Title & Description */}
              <Link to={`/projects/${project._id}`} className="cursor-pointer">
                <h3 className="text-sm font-bold text-zinc-200 hover:text-brand-purple transition-colors mb-1">
                  {project.name}
                </h3>
              </Link>
              {project.client && (
                <span className="text-[10px] text-zinc-500 font-semibold block mb-2">Cliente: {project.client}</span>
              )}
              {project.description && (
                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{project.description}</p>
              )}
            </div>

            {/* Estimations metrics */}
            <div className="border-t border-zinc-800/80 pt-4 flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-zinc-500">
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-900">
                  <span>Estimado</span>
                  <p className="text-zinc-300 font-bold mt-0.5">{formatHours(project.estimatedDuration)}</p>
                </div>
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-900">
                  <span>Trabajado</span>
                  <p className="text-emerald-400 font-bold mt-0.5">{formatHours(project.accumulatedDuration)}</p>
                </div>
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-900">
                  <span>Restante</span>
                  <p className="text-zinc-300 font-bold mt-0.5">{formatHours(project.remainingDuration)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                  <span>Progreso de Tareas</span>
                  <span>{project.completionPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: project.color, width: `${project.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Footer CTA */}
              <div className="flex justify-end mt-2">
                <Link to={`/projects/${project._id}`} className="w-full">
                  <Button variant="secondary" size="sm" className="w-full" rightIcon={<Clock className="w-3.5 h-3.5" />}>
                    Planificar / Ejecutar
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-zinc-600 border border-dashed border-zinc-800 rounded-3xl">
            Aún no has creado ningún proyecto. Haz clic en "Crear Proyecto" para comenzar.
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Proyecto">
        <form onSubmit={handleSubmit(handleCreateProject)} className="flex flex-col gap-4">
          <Input
            label="Nombre del Proyecto"
            placeholder="ej. Rediseño Web Corporativa, Desarrollo App Móvil..."
            error={errors.name?.message as string}
            {...register('name')}
          />

          <Input
            label="Descripción"
            placeholder="ej. Planificación de hitos, maquetación y pruebas de integración..."
            error={errors.description?.message as string}
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cliente"
              placeholder="ej. ACME Corp"
              error={errors.client?.message as string}
              {...register('client')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Prioridad</label>
              <select
                className="bg-zinc-900 border border-zinc-800 focus:border-brand-purple text-zinc-100 rounded-xl px-3 py-2 text-sm outline-none placeholder:text-zinc-600"
                {...register('priority')}
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
              error={errors.startDate?.message as string}
              {...register('startDate')}
            />
            <Input
              label="Fecha Entrega"
              type="date"
              error={errors.endDate?.message as string}
              {...register('endDate')}
            />
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Color del Proyecto</span>
            <div className="flex gap-2.5 flex-wrap">
              {['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899', '#7C3AED'].map((c) => (
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
            <Button type="submit" isLoading={createProjectMutation.isPending}>
              Guardar Proyecto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ProjectsPage;
