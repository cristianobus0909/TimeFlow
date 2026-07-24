import { Comment, IComment } from './comment.model';
import { TimelineService } from '@modules/timeline/timeline.service';
import { Types } from 'mongoose';
import { ValidationError } from '@core/errors/classes';

export class CommentService {
  /**
   * Add a comment to client, project or task
   */
  public async addComment(
    orgId: string,
    userId: string,
    data: { refType: 'CLIENT' | 'PROJECT' | 'TASK'; refId: string; content: string }
  ): Promise<IComment> {
    if (!data.content || data.content.trim() === '') {
      throw new ValidationError('El contenido del comentario no puede estar vacío.');
    }

    const comment = await Comment.create({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      refType: data.refType,
      refId: new Types.ObjectId(data.refId),
      content: data.content,
      createdBy: new Types.ObjectId(userId),
    });

    let detail = `Añadió un comentario en la tarea`;
    if (data.refType === 'CLIENT') detail = `Añadió un comentario en la ficha de cliente`;
    else if (data.refType === 'PROJECT') detail = `Añadió un comentario en el proyecto`;

    await TimelineService.logEvent(orgId, userId, 'COMMENT_ADDED', detail, data.refType as any, data.refId);

    return comment;
  }

  /**
   * Fetch comments of client, project or task
   */
  public async getComments(orgId: string, refType: 'CLIENT' | 'PROJECT' | 'TASK', refId: string): Promise<IComment[]> {
    return Comment.find({
      organization: new Types.ObjectId(orgId),
      refType,
      refId: new Types.ObjectId(refId),
    }).populate('user', 'name email').sort({ createdAt: 1 });
  }
}
export default CommentService;
