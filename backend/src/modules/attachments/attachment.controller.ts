import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { AttachmentService } from './attachment.service';
import { AuthorizationError, ValidationError } from '@core/errors/classes';

export class AttachmentController {
  private service: AttachmentService;

  constructor() {
    this.service = new AttachmentService();
  }

  private getContext(req: AuthenticatedRequest) {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!orgId || !userId) {
      throw new AuthorizationError('Usuario no autenticado.');
    }
    return { orgId, userId };
  }

  public addAttachment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId, userId } = this.getContext(req);
      const { refType, refId, filename, mimetype, size, url } = req.body;

      if (!refType || !refId || !filename || !url) {
        throw new ValidationError('Faltan parámetros requeridos.');
      }

      const attachment = await this.service.addAttachment(orgId, userId, {
        refType,
        refId,
        filename,
        mimetype,
        size: Number(size) || 0,
        url,
      });
      res.status(201).json(attachment);
    } catch (error) {
      next(error);
    }
  };

  public getAttachments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId } = this.getContext(req);
      const { refType, refId } = req.query;

      if (!refType || !refId) {
        throw new ValidationError('Faltan parámetros de consulta (refType y refId).');
      }

      const attachments = await this.service.getAttachments(orgId, refType as any, refId as string);
      res.status(200).json(attachments);
    } catch (error) {
      next(error);
    }
  };
}
export default AttachmentController;
