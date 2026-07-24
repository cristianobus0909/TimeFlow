import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { OrganizationService } from './organization.service';
import { createOrganizationSchema, updateOrganizationSchema } from './organization.schema';
import { ValidationError, AuthorizationError } from '@core/errors/classes';

export class OrganizationController {
  private service: OrganizationService;

  constructor() {
    this.service = new OrganizationService();
  }

  public getMyOrganization = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userOrgId = req.user?.organizationId;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      if (!userOrgId) {
        // Return 200 with null if the user hasn't joined or created any organization yet
        res.status(200).json(null);
        return;
      }

      const org = await this.service.getOrganizationById(userOrgId);
      res.status(200).json(org);
    } catch (error) {
      next(error);
    }
  };

  public getOrganizationById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userOrgId = req.user?.organizationId;

      if (userOrgId !== id && req.user?.role !== 'OWNER' && req.user?.role !== 'ADMIN') {
        throw new AuthorizationError('No tiene acceso a los datos de esta organización.');
      }

      const org = await this.service.getOrganizationById(id);
      res.status(200).json(org);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      const result = createOrganizationSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const org = await this.service.createOrganization(result.data, userId);
      res.status(201).json({
        message: 'Organización creada correctamente.',
        organization: org,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userOrgId = req.user?.organizationId;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      if (userOrgId !== id || (req.user?.role !== 'OWNER' && req.user?.role !== 'ADMIN')) {
        throw new AuthorizationError('No está autorizado a modificar esta organización.');
      }

      const result = updateOrganizationSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const org = await this.service.updateOrganization(id, result.data, userId);
      res.status(200).json({
        message: 'Organización actualizada correctamente.',
        organization: org,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userOrgId = req.user?.organizationId;

      if (!userId) {
        throw new AuthorizationError('Usuario no autenticado.');
      }

      if (userOrgId !== id || req.user?.role !== 'OWNER') {
        throw new AuthorizationError('Solo el OWNER de la organización puede eliminarla.');
      }

      await this.service.deleteOrganization(id, userId);
      res.status(200).json({
        message: 'Organización eliminada correctamente.',
      });
    } catch (error) {
      next(error);
    }
  };
}
export default OrganizationController;
