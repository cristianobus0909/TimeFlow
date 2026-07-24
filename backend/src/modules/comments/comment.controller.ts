import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { CommentService } from './comment.service';
import { AuthorizationError, ValidationError } from '@core/errors/classes';

export class CommentController {
  private service: CommentService;

  constructor() {
    this.service = new CommentService();
  }

  private getContext(req: AuthenticatedRequest) {
    const orgId = req.user?.organizationId;
    const userId = req.user?.userId;
    if (!orgId || !userId) {
      throw new AuthorizationError('Usuario no autenticado.');
    }
    return { orgId, userId };
  }

  public addComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId, userId } = this.getContext(req);
      const { refType, refId, content } = req.body;

      if (!refType || !refId || !content) {
        throw new ValidationError('Faltan parámetros requeridos.');
      }

      const comment = await this.service.addComment(orgId, userId, { refType, refId, content });
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  };

  public getComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orgId } = this.getContext(req);
      const { refType, refId } = req.query;

      if (!refType || !refId) {
        throw new ValidationError('Faltan parámetros de consulta (refType y refId).');
      }

      const comments = await this.service.getComments(orgId, refType as any, refId as string);
      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  };
}
export default CommentController;
