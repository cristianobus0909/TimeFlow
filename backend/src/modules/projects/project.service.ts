import { ProjectRepository } from './project.repository';
import { Project, IProject } from './project.model';
import { CreateProjectInput, UpdateProjectInput } from './project.schema';
import { ProjectTask } from '@modules/tasks/project-task.model';
import { Task } from '@modules/tasks/task.model';
import { WorkSession } from '@modules/workSessions/work-session.model';
import { Client } from '@modules/clients/client.model';
import { NotFoundError, ValidationError } from '@core/errors/classes';
import { Types } from 'mongoose';

export class ProjectService {
  private repository: ProjectRepository;

  constructor() {
    this.repository = new ProjectRepository();
  }

  public async getProjects(orgId: string, status?: string): Promise<IProject[]> {
    const query: any = { organization: new Types.ObjectId(orgId) };
    if (status) query.status = status;
    
    // Scoped directly using mongoose to support quick listing with sorting
    return this.repository.findAll(orgId);
  }

  public async getProjectById(id: string, orgId: string): Promise<{ project: IProject; tasks: any[] }> {
    const project = await this.repository.findById(id, orgId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const projectTasks = await ProjectTask.find({ projectId: id })
      .sort({ order: 1 })
      .populate('taskId');

    return {
      project,
      tasks: projectTasks,
    };
  }

  public async createProject(data: CreateProjectInput, orgId: string, userId: string): Promise<IProject> {
    if (data.client) {
      const client = await Client.findOne({ _id: data.client, organization: orgId });
      if (!client) {
        throw new ValidationError('El cliente especificado no pertenece a su organización.');
      }
    }

    return this.repository.create({
      ...data,
      status: data.status as any,
      priority: data.priority as any,
      client: data.client ? new Types.ObjectId(data.client) : undefined,
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(userId),
    });
  }

  public async updateProject(
    id: string,
    orgId: string,
    data: UpdateProjectInput,
    userId: string
  ): Promise<IProject> {
    const project = await this.repository.findById(id, orgId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    if (data.client) {
      const client = await Client.findOne({ _id: data.client, organization: orgId });
      if (!client) {
        throw new ValidationError('El cliente especificado no pertenece a su organización.');
      }
    }

    const updateData: any = { ...data };
    if (data.client) {
      updateData.client = new Types.ObjectId(data.client);
    }

    const updated = await this.repository.update(id, orgId, updateData, userId);
    if (!updated) {
      throw new NotFoundError('No se pudo actualizar el proyecto.');
    }

    return updated;
  }

  public async deleteProject(id: string, orgId: string, userId: string): Promise<void> {
    const project = await this.repository.softDelete(id, orgId, userId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }
  }

  public async recalculateProjectEstimates(projectId: string): Promise<void> {
    const dbProject = await Project.findById(projectId);
    if (!dbProject) return;

    const projectTasks = await ProjectTask.find({ projectId });
    const taskIds = projectTasks.map((pt) => pt.taskId);

    const tasks = await Task.find({ _id: { $in: taskIds } });
    const taskAvgMap = new Map<string, number>();
    tasks.forEach((t) => {
      taskAvgMap.set(t._id.toString(), t.averageDuration || 0);
    });

    let estimatedDuration = 0;
    projectTasks.forEach((pt) => {
      const avg = taskAvgMap.get(pt.taskId.toString()) || 0;
      estimatedDuration += avg;
    });

    const sessions = await WorkSession.find({ project: new Types.ObjectId(projectId) });
    const accumulatedDuration = sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const remainingDuration = Math.max(0, estimatedDuration - accumulatedDuration);

    const completedTasksCount = projectTasks.filter((pt) => pt.status === 'completed').length;
    const totalTasksCount = projectTasks.length;
    const completionPercentage = totalTasksCount > 0 
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

    await Project.findByIdAndUpdate(projectId, {
      $set: {
        estimatedDuration,
        accumulatedDuration,
        remainingDuration,
        completionPercentage: Math.min(100, completionPercentage)
      }
    });
  }

  public async addTaskToProject(
    projectId: string,
    orgId: string,
    taskId: string,
    quantity: number,
    userId: string
  ): Promise<any[]> {
    const project = await this.repository.findById(projectId, orgId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const task = await Task.findOne({ _id: taskId, organization: orgId });
    if (!task) {
      throw new NotFoundError('Tarea no encontrada.');
    }

    const lastTask = await ProjectTask.findOne({ projectId }).sort({ order: -1 });
    const startOrder = lastTask ? lastTask.order + 1 : 0;
    const projectTasks = [];

    for (let i = 0; i < quantity; i++) {
      projectTasks.push({
        projectId,
        taskId,
        order: startOrder + i,
        status: 'pending' as 'completed' | 'pending',
      });
    }

    const createdTasks = await ProjectTask.insertMany(projectTasks);
    await this.recalculateProjectEstimates(projectId);
    return createdTasks;
  }

  public async removeTaskFromProject(projectId: string, orgId: string, projectTaskId: string): Promise<void> {
    const project = await this.repository.findById(projectId, orgId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    await ProjectTask.deleteOne({ projectId, _id: projectTaskId });
    await this.recalculateProjectEstimates(projectId);
  }

  public async reorderProjectTasks(projectId: string, orgId: string, taskOrders: any[]): Promise<void> {
    const project = await this.repository.findById(projectId, orgId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    await Promise.all(
      taskOrders.map((to) =>
        ProjectTask.updateOne(
          { projectId, _id: to.projectTaskId },
          { $set: { order: to.order } }
        )
      )
    );
  }

  public async toggleProjectTaskStatus(
    projectId: string,
    orgId: string,
    projectTaskId: string,
    status?: string,
    actualDuration?: number
  ): Promise<any> {
    const project = await this.repository.findById(projectId, orgId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const projectTask = await ProjectTask.findOne({ projectId, _id: projectTaskId });
    if (!projectTask) {
      throw new NotFoundError('Relación tarea-proyecto no encontrada.');
    }

    if (status !== undefined) projectTask.status = status as 'completed' | 'pending';
    if (actualDuration !== undefined) projectTask.actualDuration = actualDuration;

    await projectTask.save();
    await this.recalculateProjectEstimates(projectId);
    return projectTask;
  }

  public async getProjectHealth(projectId: string, orgId: string): Promise<any> {
    const project = await this.repository.findById(projectId, orgId);
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const sessions = await WorkSession.find({ project: project._id, status: 'COMPLETED' });
    const hoursUsed = sessions.reduce((sum: number, s: any) => sum + (s.effectiveDuration || 0), 0) / 3600;
    const budget = project.budgetHours || 0;

    const projectTasks = await ProjectTask.find({ projectId: project._id });
    const taskIds = projectTasks.map(pt => pt.taskId);
    
    const tasks = await Task.find({ _id: { $in: taskIds } });
    const blockedTasksCount = tasks.filter(t => t.status === 'BLOCKED').length;
    const overdueTasksCount = tasks.filter(t => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== 'DONE' && t.status !== 'completed').length;

    let status: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    let reasons: string[] = [];

    if (budget > 0 && hoursUsed > budget) {
      status = 'RED';
      reasons.push('Se ha excedido el presupuesto de horas.');
    }
    if (project.endDate && new Date(project.endDate).getTime() < Date.now() && project.status !== 'COMPLETED') {
      status = 'RED';
      reasons.push('La fecha límite del proyecto ya venció y sigue activo.');
    }
    if (tasks.length > 0 && (blockedTasksCount / tasks.length) >= 0.3) {
      status = 'RED';
      reasons.push('Más del 30% de las tareas asignadas están bloqueadas.');
    }

    if (status === 'GREEN') {
      if (budget > 0 && hoursUsed >= budget * 0.8) {
        status = 'YELLOW';
        reasons.push('Se ha consumido más del 80% del presupuesto de horas.');
      }
      if (overdueTasksCount > 0) {
        status = 'YELLOW';
        reasons.push(`Hay ${overdueTasksCount} tarea(s) vencida(s) sin finalizar.`);
      }
      if (blockedTasksCount > 0) {
        status = 'YELLOW';
        reasons.push(`Hay ${blockedTasksCount} tarea(s) bloqueada(s).`);
      }
    }

    if (status === 'GREEN' && reasons.length === 0) {
      reasons.push('El proyecto progresa de acuerdo a lo planificado.');
    }

    const healthLabels = {
      GREEN: 'Excelente',
      YELLOW: 'Atención',
      RED: 'Riesgo'
    };

    return {
      status,
      label: healthLabels[status],
      reasons,
      metrics: {
        hoursUsed: Math.round(hoursUsed * 10) / 10,
        budget,
        blockedTasks: blockedTasksCount,
        overdueTasks: overdueTasksCount
      }
    };
  }
}
export default ProjectService;
