import { Attachment, IAttachment } from './attachment.model';
import { TimelineService } from '@modules/timeline/timeline.service';
import { Types } from 'mongoose';
import { ValidationError } from '@core/errors/classes';

export class AttachmentService {
  /**
   * Add attachment metadata to Client, Project, or Task
   */
  public async addAttachment(
    orgId: string,
    userId: string,
    data: { refType: 'CLIENT' | 'PROJECT' | 'TASK'; refId: string; filename: string; mimetype?: string; size: number; url: string }
  ): Promise<IAttachment> {
    if (!data.filename || !data.url) {
      throw new ValidationError('El nombre y URL del archivo son obligatorios.');
    }

    const attachment = await Attachment.create({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      refType: data.refType,
      refId: new Types.ObjectId(data.refId),
      filename: data.filename,
      mimetype: data.mimetype || 'application/octet-stream',
      size: data.size || 0,
      url: data.url,
      createdBy: new Types.ObjectId(userId),
    });

    let detail = `Adjuntó el archivo "${data.filename}" en la tarea`;
    if (data.refType === 'CLIENT') detail = `Adjuntó el archivo "${data.filename}" en la ficha de cliente`;
    else if (data.refType === 'PROJECT') detail = `Adjuntó el archivo "${data.filename}" en el proyecto`;

    await TimelineService.logEvent(orgId, userId, 'ATTACHMENT_ADDED', detail, data.refType as any, data.refId);

    return attachment;
  }

  /**
   * Fetch attachments of client, project or task
   */
  public async getAttachments(orgId: string, refType: 'CLIENT' | 'PROJECT' | 'TASK', refId: string): Promise<IAttachment[]> {
    return Attachment.find({
      organization: new Types.ObjectId(orgId),
      refType,
      refId: new Types.ObjectId(refId),
    }).populate('user', 'name email').sort({ createdAt: -1 });
  }
}
export default AttachmentService;
