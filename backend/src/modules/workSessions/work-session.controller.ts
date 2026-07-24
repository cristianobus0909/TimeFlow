import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { WorkSessionService } from './work-session.service';
import { startWorkSessionSchema, finishWorkSessionSchema, dailyGoalSchema } from './work-session.schema';
import { ValidationError, AuthorizationError } from '@core/errors/classes';
import { Types } from 'mongoose';

export class WorkSessionController {
  private service: WorkSessionService;

  constructor() {
    this.service = new WorkSessionService();
  }

  private getOrgId(req: AuthenticatedRequest): string {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AuthorizationError('Su cuenta no está vinculada a ninguna organización. Por favor, únase o cree una organización primero.');
    }
    return orgId;
  }

  public getActive = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const active = await this.service.getActiveSession(orgId, userId);
      
      if (active) {
        const obj = active.toObject ? active.toObject() : active;
        res.status(200).json({
          ...obj,
          taskId: obj.task,
          projectId: obj.project,
        });
      } else {
        res.status(200).json(null);
      }
    } catch (error) {
      next(error);
    }
  };

  public getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const { project, client, task, category, status } = req.query;

      const filters: any = {};
      if (project) filters.project = new Types.ObjectId(project as string);
      if (client) filters.client = new Types.ObjectId(client as string);
      if (task) filters.task = new Types.ObjectId(task as string);
      if (category) {
        filters.category = Types.ObjectId.isValid(category as string)
          ? new Types.ObjectId(category as string)
          : category;
      }
      if (status) filters.status = status;

      const sessions = await this.service.getHistory(orgId, filters);
      
      const mapped = sessions.map((s: any) => {
        const obj = s.toObject ? s.toObject() : s;
        return {
          ...obj,
          taskId: obj.task,
          projectId: obj.project,
        };
      });

      res.status(200).json(mapped);
    } catch (error) {
      next(error);
    }
  };

  public start = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const result = startWorkSessionSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const session = await this.service.startSession(result.data, orgId, userId);
      const obj = session.toObject ? session.toObject() : session;
      res.status(201).json({
        ...obj,
        taskId: obj.task,
        projectId: obj.project,
      });
    } catch (error) {
      next(error);
    }
  };

  public pause = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const id = req.params.id as string;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const session = await this.service.pauseSession(id, orgId, userId);
      const obj = session.toObject ? session.toObject() : session;
      res.status(200).json({
        ...obj,
        taskId: obj.task,
        projectId: obj.project,
      });
    } catch (error) {
      next(error);
    }
  };

  public resume = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const id = req.params.id as string;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const session = await this.service.resumeSession(id, orgId, userId);
      const obj = session.toObject ? session.toObject() : session;
      res.status(200).json({
        ...obj,
        taskId: obj.task,
        projectId: obj.project,
      });
    } catch (error) {
      next(error);
    }
  };

  public finish = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const id = req.params.id as string;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const result = finishWorkSessionSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const session = await this.service.finishSession(id, orgId, userId, result.data);
      const obj = session.toObject ? session.toObject() : session;
      res.status(200).json({
        ...obj,
        taskId: obj.task,
        projectId: obj.project,
      });
    } catch (error) {
      next(error);
    }
  };

  public cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const id = req.params.id as string;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const session = await this.service.cancelSession(id, orgId, userId);
      const obj = session.toObject ? session.toObject() : session;
      res.status(200).json({
        ...obj,
        taskId: obj.task,
        projectId: obj.project,
      });
    } catch (error) {
      next(error);
    }
  };

  // Daily Goals Controller Actions
  public saveGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const result = dailyGoalSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const goal = await this.service.createOrUpdateDailyGoal(result.data, orgId, userId);
      res.status(200).json(goal);
    } catch (error) {
      next(error);
    }
  };

  public getTodayGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const goal = await this.service.getTodayDailyGoal(orgId, userId);
      res.status(200).json(goal);
    } catch (error) {
      next(error);
    }
  };

  public getIndicators = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const stats = await this.service.getIndicators(orgId, userId);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  };
}
export default WorkSessionController;
