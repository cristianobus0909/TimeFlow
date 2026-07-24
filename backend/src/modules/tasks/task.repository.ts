import { Task, ITask } from './task.model';
import { Types } from 'mongoose';

export class TaskRepository {
  public async findById(id: string, orgId: string): Promise<ITask | null> {
    return Task.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    }).populate('project').populate('assignedTo');
  }

  public async findAll(orgId: string, filters: any = {}): Promise<ITask[]> {
    const query: any = {
      organization: new Types.ObjectId(orgId),
      ...filters,
    };
    return Task.find(query).populate('project').populate('assignedTo').sort({ updatedAt: -1 });
  }

  public async create(data: Partial<ITask>): Promise<ITask> {
    const task = new Task(data);
    return task.save();
  }

  public async update(
    id: string,
    orgId: string,
    data: Partial<ITask>,
    userId: string
  ): Promise<ITask | null> {
    return Task.findOneAndUpdate(
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
    ).populate('project').populate('assignedTo');
  }

  public async softDelete(id: string, orgId: string, userId: string): Promise<ITask | null> {
    return Task.findOneAndUpdate(
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
}
export default TaskRepository;
