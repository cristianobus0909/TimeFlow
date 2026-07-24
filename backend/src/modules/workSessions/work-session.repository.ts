import { WorkSession, IWorkSession } from './work-session.model';
import { DailyGoal, IDailyGoal } from './daily-goal.model';
import { Types } from 'mongoose';

export class WorkSessionRepository {
  public async findById(id: string, orgId: string): Promise<IWorkSession | null> {
    return WorkSession.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    }).populate('project').populate('task').populate('client').populate('rate');
  }

  public async findActiveSession(orgId: string, userId: string): Promise<IWorkSession | null> {
    return WorkSession.findOne({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      status: { $in: ['RUNNING', 'PAUSED'] },
    }).populate('project').populate('task').populate('client').populate('rate');
  }

  public async create(data: Partial<IWorkSession>): Promise<IWorkSession> {
    const session = new WorkSession(data);
    return session.save();
  }

  public async update(
    id: string,
    orgId: string,
    data: Partial<IWorkSession>,
    userId: string
  ): Promise<IWorkSession | null> {
    return WorkSession.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        organization: new Types.ObjectId(orgId),
      },
      {
        $set: {
          ...data,
          updatedBy: new Types.ObjectId(userId),
        },
      },
      { new: true }
    ).populate('project').populate('task').populate('client').populate('rate');
  }

  public async softDelete(id: string, orgId: string, userId: string): Promise<IWorkSession | null> {
    return WorkSession.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        organization: new Types.ObjectId(orgId),
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: new Types.ObjectId(userId),
        },
      },
      { new: true }
    );
  }

  public async findHistory(orgId: string, filters: any = {}): Promise<IWorkSession[]> {
    const query: any = {
      organization: new Types.ObjectId(orgId),
      ...filters,
    };
    return WorkSession.find(query)
      .populate('project')
      .populate('task')
      .populate('client')
      .populate('rate')
      .sort({ startTime: -1 });
  }

  // Daily Goal Methods
  public async findDailyGoal(orgId: string, userId: string, date: Date): Promise<IDailyGoal | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return DailyGoal.findOne({
      organization: new Types.ObjectId(orgId),
      user: new Types.ObjectId(userId),
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  public async createDailyGoal(data: Partial<IDailyGoal>): Promise<IDailyGoal> {
    const goal = new DailyGoal(data);
    return goal.save();
  }

  public async updateDailyGoal(id: string, data: Partial<IDailyGoal>, userId: string): Promise<IDailyGoal | null> {
    return DailyGoal.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          updatedBy: new Types.ObjectId(userId),
        },
      },
      { new: true }
    );
  }
}
export default WorkSessionRepository;
