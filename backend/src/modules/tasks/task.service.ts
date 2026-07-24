import { TaskRepository } from './task.repository';
import { ITask } from './task.model';
import { CreateTaskInput, UpdateTaskInput } from './task.schema';
import { Project } from '@modules/projects/project.model';
import { Category } from '@modules/timer/category.model';
import { User } from '@modules/users/user.model';
import { NotFoundError, ValidationError } from '@core/errors/classes';
import { Types } from 'mongoose';

export class TaskService {
  private repository: TaskRepository;

  constructor() {
    this.repository = new TaskRepository();
  }

  public async getTasks(
    orgId: string,
    filters: { status?: string; favorite?: boolean; category?: string }
  ): Promise<ITask[]> {
    const dbFilters: any = {};
    if (filters.status) dbFilters.status = filters.status;
    if (filters.favorite !== undefined) dbFilters.favorite = filters.favorite;
    
    if (filters.category) {
      if (Types.ObjectId.isValid(filters.category)) {
        dbFilters.category = new Types.ObjectId(filters.category);
      } else {
        dbFilters.category = filters.category;
      }
    }

    return this.repository.findAll(orgId, dbFilters);
  }

  public async getTaskById(id: string, orgId: string): Promise<ITask> {
    const task = await this.repository.findById(id, orgId);
    if (!task) {
      throw new NotFoundError('Tarea no encontrada.');
    }
    return task;
  }

  public async createTask(data: CreateTaskInput, orgId: string, userId: string): Promise<ITask> {
    // Validate project tenancy
    if (data.project) {
      const project = await Project.findOne({ _id: data.project, organization: orgId });
      if (!project) {
        throw new ValidationError('El proyecto especificado no pertenece a su organización.');
      }
    }

    // Validate category tenancy (if it's an ObjectId)
    if (data.category && Types.ObjectId.isValid(data.category)) {
      const category = await Category.findOne({ _id: data.category, organization: orgId });
      if (!category) {
        throw new ValidationError('La categoría especificada no pertenece a su organización.');
      }
    }

    // Validate assigned user tenancy
    if (data.assignedTo) {
      const user = await User.findOne({ _id: data.assignedTo, organization: orgId });
      if (!user) {
        throw new ValidationError('El usuario asignado no pertenece a su organización.');
      }
    }

    const taskData: any = {
      ...data,
      status: data.status as any,
      priority: data.priority as any,
      project: data.project ? new Types.ObjectId(data.project) : undefined,
      assignedTo: data.assignedTo ? new Types.ObjectId(data.assignedTo) : undefined,
      category: Types.ObjectId.isValid(data.category) ? new Types.ObjectId(data.category) : data.category,
      organization: new Types.ObjectId(orgId),
      userId: new Types.ObjectId(userId), // Legacy compatibility
      createdBy: new Types.ObjectId(userId),
    };

    if (data.dependencies) {
      taskData.dependencies = data.dependencies.map(id => new Types.ObjectId(id));
    }

    return this.repository.create(taskData);
  }

  public async updateTask(
    id: string,
    orgId: string,
    data: UpdateTaskInput,
    userId: string
  ): Promise<ITask> {
    const task = await this.repository.findById(id, orgId);
    if (!task) {
      throw new NotFoundError('Tarea no encontrada.');
    }

    // Validate project tenancy
    if (data.project) {
      const project = await Project.findOne({ _id: data.project, organization: orgId });
      if (!project) {
        throw new ValidationError('El proyecto especificado no pertenece a su organización.');
      }
    }

    // Validate category tenancy
    if (data.category && Types.ObjectId.isValid(data.category)) {
      const category = await Category.findOne({ _id: data.category, organization: orgId });
      if (!category) {
        throw new ValidationError('La categoría especificada no pertenece a su organización.');
      }
    }

    // Validate assigned user tenancy
    if (data.assignedTo) {
      const user = await User.findOne({ _id: data.assignedTo, organization: orgId });
      if (!user) {
        throw new ValidationError('El usuario asignado no pertenece a su organización.');
      }
    }

    const updateData: any = { ...data };
    if (data.project === null) updateData.project = null;
    else if (data.project) updateData.project = new Types.ObjectId(data.project);

    if (data.assignedTo === null) updateData.assignedTo = null;
    else if (data.assignedTo) updateData.assignedTo = new Types.ObjectId(data.assignedTo);

    if (data.category) {
      updateData.category = Types.ObjectId.isValid(data.category) ? new Types.ObjectId(data.category) : data.category;
    }

    if (data.dependencies) {
      updateData.dependencies = data.dependencies.map(id => new Types.ObjectId(id));
    }

    const updated = await this.repository.update(id, orgId, updateData, userId);
    if (!updated) {
      throw new NotFoundError('No se pudo actualizar la tarea.');
    }

    return updated;
  }

  public async deleteTask(id: string, orgId: string, userId: string): Promise<void> {
    const task = await this.repository.softDelete(id, orgId, userId);
    if (!task) {
      throw new NotFoundError('Tarea no encontrada.');
    }
  }
}
export default TaskService;
