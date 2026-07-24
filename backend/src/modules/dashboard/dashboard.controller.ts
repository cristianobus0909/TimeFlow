import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { DashboardService } from './dashboard.service';
import { AuthorizationError } from '@core/errors/classes';

export class DashboardController {
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
  }

  public getOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.user?.organizationId;
      const userId = req.user?.userId;

      if (!orgId) {
        throw new AuthorizationError('Su cuenta no está vinculada a ninguna organización.');
      }
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const overview = await this.service.getOverview(orgId, userId);
      res.status(200).json(overview);
    } catch (error) {
      next(error);
    }
  };
}
export default DashboardController;
