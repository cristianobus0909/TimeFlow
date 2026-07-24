import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { TaskService } from './task.service';
import { createTaskSchema, updateTaskSchema } from './task.schema';
import { ValidationError, AuthorizationError } from '@core/errors/classes';

export class TaskController {
  private service: TaskService;

  constructor() {
    this.service = new TaskService();
  }

  private getOrgId(req: AuthenticatedRequest): string {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AuthorizationError('Su cuenta no está vinculada a ninguna organización. Por favor, únase o cree una organización primero.');
    }
    return orgId;
  }

  public getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const { status, favorite, category } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (favorite) filters.favorite = favorite === 'true';
      if (category) filters.category = category;

      const tasks = await this.service.getTasks(orgId, filters);
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  };

  public getTaskById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const task = await this.service.getTaskById(id, orgId);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const result = createTaskSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const task = await this.service.createTask(result.data, orgId, userId);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const task = await this.service.updateTask(id, orgId, result.data, userId);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      await this.service.deleteTask(id, orgId, userId);
      res.status(200).json({ message: 'Tarea archivada correctamente para preservar su historial.' });
    } catch (error) {
      next(error);
    }
  };
}
export default TaskController;
