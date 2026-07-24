import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { TimelineService } from './timeline.service';
import { AuthorizationError, ValidationError } from '@core/errors/classes';

export class TimelineController {
  private service: TimelineService;

  constructor() {
    this.service = new TimelineService();
  }

  private getContext(req: AuthenticatedRequest) {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AuthorizationError('Usuario no autenticado.');
    }
    return { orgId };
  }

  public getEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId } = this.getContext(req);
      const { refType, refId } = req.query;

      if (!refType || !refId) {
        throw new ValidationError('Faltan parámetros de consulta (refType y refId).');
      }

      const events = await this.service.getEvents(orgId, refType as string, refId as string);
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  };
}
export default TimelineController;
