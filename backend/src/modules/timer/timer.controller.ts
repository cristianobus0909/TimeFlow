import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { WorkSessionService } from '@modules/workSessions/work-session.service';
import { startWorkSessionSchema as createWorkSessionSchema } from '@modules/workSessions/work-session.schema';
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

  public getSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const { taskId, projectId, limit, skip } = req.query;

      const filters: any = { user: new Types.ObjectId(userId) };
      if (taskId) filters.task = new Types.ObjectId(taskId as string);
      if (projectId) filters.project = new Types.ObjectId(projectId as string);

      const parsedLimit = limit ? parseInt(limit as string, 10) : 50;
      const parsedSkip = skip ? parseInt(skip as string, 10) : 0;

      const allSessions = await this.service.getSessions(orgId, filters);
      const total = allSessions.length;
      
      // Implement pagination in-memory or slice from MongoDB results
      const sessions = allSessions.slice(parsedSkip, parsedSkip + parsedLimit);

      // Map sessions to match the frontend expectations of populated taskId and projectId
      const mappedSessions = sessions.map((s: any) => {
        const sessionObj = s.toObject ? s.toObject() : s;
        // Map fields to match legacy frontend keys: taskId -> task, projectId -> project
        return {
          ...sessionObj,
          taskId: sessionObj.task,
          projectId: sessionObj.project,
        };
      });

      res.status(200).json({
        total,
        limit: parsedLimit,
        skip: parsedSkip,
        sessions: mappedSessions,
      });
    } catch (error) {
      next(error);
    }
  };

  public createSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const { startTime, endTime, duration, notes, device, breaks } = req.body;

      const result = createWorkSessionSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const logData = {
        ...result.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parseInt(duration, 10) || 0,
        breaks: breaks || [],
      };

      const session = await this.service.logCompletedSession(logData, orgId, userId);
      
      // Map to legacy response layout
      const mappedSession = {
        ...session.toObject(),
        taskId: session.task,
        projectId: session.project,
      };

      res.status(201).json({
        message: 'Sesión registrada y estadísticas actualizadas con éxito.',
        session: mappedSession,
        breaks: [], // breaks are saved in background, returning empty is safe for legacy compatibility
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const id = req.params.id as string;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      await this.service.deleteSession(id, orgId, userId);
      res.status(200).json({ message: 'Sesión eliminada y estadísticas actualizadas.' });
    } catch (error) {
      next(error);
    }
  };

  public updateSessionNotes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const userId = req.user?.userId;
      const id = req.params.id as string;
      const { notes } = req.body;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const updated = await this.service.updateSession(id, orgId, { notes }, userId);
      
      const mappedSession = {
        ...updated.toObject(),
        taskId: updated.task,
        projectId: updated.project,
      };

      res.status(200).json(mappedSession);
    } catch (error) {
      next(error);
    }
  };
}
export default WorkSessionController;
