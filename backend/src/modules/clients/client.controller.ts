import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { ClientService } from './client.service';
import { createClientSchema, updateClientSchema } from './client.schema';
import { ValidationError, AuthorizationError } from '@core/errors/classes';

export class ClientController {
  private service: ClientService;

  constructor() {
    this.service = new ClientService();
  }

  private getOrgId(req: AuthenticatedRequest): string {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AuthorizationError('Su cuenta no está vinculada a ninguna organización. Por favor, únase o cree una organización primero.');
    }
    return orgId;
  }

  public getClients = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = this.getOrgId(req);
      const clients = await this.service.getClients(orgId);
      res.status(200).json(clients);
    } catch (error) {
      next(error);
    }
  };

  public getClientById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orgId = this.getOrgId(req);
      const client = await this.service.getClientById(id, orgId);
      res.status(200).json(client);
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

      const result = createClientSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const client = await this.service.createClient(result.data, orgId, userId);
      res.status(201).json({
        message: 'Cliente creado correctamente.',
        client,
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

      const result = updateClientSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const client = await this.service.updateClient(id, orgId, result.data, userId);
      res.status(200).json({
        message: 'Cliente actualizado correctamente.',
        client,
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

      await this.service.deleteClient(id, orgId, userId);
      res.status(200).json({
        message: 'Cliente eliminado correctamente.',
      });
    } catch (error) {
      next(error);
    }
  };
}
export default ClientController;
