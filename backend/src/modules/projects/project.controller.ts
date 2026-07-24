import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { ProjectService } from './project.service';
import { createProjectSchema, updateProjectSchema } from './project.schema';
import { ValidationError, AuthorizationError } from '@core/errors/classes';

export class ProjectController {
  private service: ProjectService;

  constructor() {
    this.service = new ProjectService();
  }

  private getOrgId(req: AuthenticatedRequest): string {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AuthorizationError('Su cuenta no está vinculada a ninguna organización. Por favor, únase o cree una organización primero.');
    }
    return orgId;
  }

  public getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const { status } = req.query;
      const projects = await this.service.getProjects(orgId, status as string);
      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  };

  public getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const result = await this.service.getProjectById(id, orgId);
      res.status(200).json(result);
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

      const result = createProjectSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const project = await this.service.createProject(result.data, orgId, userId);
      res.status(201).json({
        message: 'Proyecto creado correctamente.',
        project,
      });
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

      const result = updateProjectSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const project = await this.service.updateProject(id, orgId, result.data, userId);
      res.status(200).json({
        message: 'Proyecto actualizado correctamente.',
        project,
      });
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

      await this.service.deleteProject(id, orgId, userId);
      res.status(200).json({
        message: 'Proyecto eliminado correctamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  public addTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const { taskId, quantity } = req.body;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      if (!taskId) {
        throw new ValidationError('El ID de la tarea es obligatorio.');
      }

      const createdTasks = await this.service.addTaskToProject(id, orgId, taskId, quantity, userId);
      res.status(201).json(createdTasks);
    } catch (error) {
      next(error);
    }
  };

  public removeTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const projectTaskId = req.params.projectTaskId as string;
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      await this.service.removeTaskFromProject(id, orgId, projectTaskId);
      res.status(200).json({ message: 'Tarea removida del proyecto correctamente.' });
    } catch (error) {
      next(error);
    }
  };

  public reorderTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const { taskOrders } = req.body;

      if (!Array.isArray(taskOrders)) {
        throw new ValidationError('Formato inválido. Se espera un arreglo taskOrders.');
      }

      await this.service.reorderProjectTasks(id, orgId, taskOrders);
      res.status(200).json({ message: 'Orden de tareas actualizado correctamente.' });
    } catch (error) {
      next(error);
    }
  };

  public toggleTaskStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const projectTaskId = req.params.projectTaskId as string;
      const orgId = this.getOrgId(req);
      const { status, actualDuration } = req.body;

      const projectTask = await this.service.toggleProjectTaskStatus(
        id,
        orgId,
        projectTaskId,
        status,
        actualDuration
      );
      res.status(200).json(projectTask);
    } catch (error) {
      next(error);
    }
  };
}
export default ProjectController;
