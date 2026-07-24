import { TimelineEvent } from './timeline-event.model';
import { Types } from 'mongoose';

export class TimelineService {
  /**
   * Log an event in the timeline
   */
  public static async logEvent(
    orgId: string,
    userId: string,
    action: string,
    detail: string,
    refType: 'CLIENT' | 'PROJECT' | 'TASK' | 'SESSION',
    refId: string
  ): Promise<any> {
    try {
      return await TimelineEvent.create({
        organization: new Types.ObjectId(orgId),
        user: new Types.ObjectId(userId),
        action,
        detail,
        refType,
        refId: new Types.ObjectId(refId),
        createdBy: new Types.ObjectId(userId),
      });
    } catch (e) {
      console.error('Failed to log timeline event:', e);
    }
  }

  /**
   * Fetch events of a specific entity
   */
  public async getEvents(orgId: string, refType: string, refId: string): Promise<any[]> {
    return TimelineEvent.find({
      organization: new Types.ObjectId(orgId),
      refType: refType as any,
      refId: new Types.ObjectId(refId),
    }).populate('user', 'name email').sort({ createdAt: -1 });
  }
}
export default TimelineService;
