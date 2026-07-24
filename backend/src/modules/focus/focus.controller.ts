import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { FocusService } from './focus.service';
import { AuthorizationError, ValidationError } from '@core/errors/classes';

export class FocusController {
  private service: FocusService;

  constructor() {
    this.service = new FocusService();
  }

  private getContext(req: AuthenticatedRequest) {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!orgId || !userId) {
      throw new AuthorizationError('Usuario no autenticado o sin organización.');
    }
    return { orgId, userId };
  }

  public getOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId, userId } = this.getContext(req);
      const overview = await this.service.getFocusOverview(orgId, userId);
      res.status(200).json(overview);
    } catch (error) {
      next(error);
    }
  };

  public getGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId, userId } = this.getContext(req);
      const goals = await this.service.getGoals(orgId, userId);
      res.status(200).json(goals);
    } catch (error) {
      next(error);
    }
  };

  public setGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId, userId } = this.getContext(req);
      const { period, targetHours, targetAmount, targetSessions, targetTasks } = req.body;

      if (!period || !['DAILY', 'WEEKLY', 'MONTHLY'].includes(period)) {
        throw new ValidationError('Periodo inválido.');
      }

      const goal = await this.service.setGoal(orgId, userId, {
        period,
        targetHours: Number(targetHours) || 0,
        targetAmount: Number(targetAmount) || 0,
        targetSessions: Number(targetSessions) || 0,
        targetTasks: Number(targetTasks) || 0,
      });

      res.status(200).json({
        message: 'Objetivo guardado con éxito.',
        goal,
      });
    } catch (error) {
      next(error);
    }
  };

  public getStreak = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId, userId } = this.getContext(req);
      const streak = await this.service.getStreak(orgId, userId);
      res.status(200).json(streak);
    } catch (error) {
      next(error);
    }
  };
}
export default FocusController;
