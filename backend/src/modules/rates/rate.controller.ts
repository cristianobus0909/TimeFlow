import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { RateService } from './rate.service';
import { createRateSchema, updateRateSchema } from './rate.schema';
import { ValidationError, AuthorizationError } from '@core/errors/classes';

export class RateController {
  private service: RateService;

  constructor() {
    this.service = new RateService();
  }

  private getOrgId(req: AuthenticatedRequest): string {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AuthorizationError('Su cuenta no está vinculada a ninguna organización. Por favor, únase o cree una organización primero.');
    }
    return orgId;
  }

  public getRates = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const rates = await this.service.getRates(orgId);
      res.status(200).json(rates);
    } catch (error) {
      next(error);
    }
  };

  public getRateById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const rate = await this.service.getRateById(id, orgId);
      res.status(200).json(rate);
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

      const result = createRateSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const rate = await this.service.createRate(result.data, orgId, userId);
      res.status(201).json({
        message: 'Tarifa creada correctamente.',
        rate,
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

      const result = updateRateSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const rate = await this.service.updateRate(id, orgId, result.data, userId);
      res.status(200).json({
        message: 'Tarifa actualizada correctamente.',
        rate,
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

      await this.service.deleteRate(id, orgId, userId);
      res.status(200).json({
        message: 'Tarifa eliminada correctamente.',
      });
    } catch (error) {
      next(error);
    }
  };
}
export default RateController;
