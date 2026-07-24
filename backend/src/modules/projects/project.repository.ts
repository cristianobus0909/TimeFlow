import { Project, IProject } from './project.model';
import { Types } from 'mongoose';

export class ProjectRepository {
  public async findById(id: string, orgId: string): Promise<IProject | null> {
    return Project.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    }).populate('client');
  }

  public async findAll(orgId: string): Promise<IProject[]> {
    return Project.find({
      organization: new Types.ObjectId(orgId),
    }).populate('client');
  }

  public async create(data: Partial<IProject>): Promise<IProject> {
    const project = new Project(data);
    return project.save();
  }

  public async update(
    id: string,
    orgId: string,
    data: Partial<IProject>,
    userId: string
  ): Promise<IProject | null> {
    return Project.findOneAndUpdate(
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
    ).populate('client');
  }

  public async softDelete(id: string, orgId: string, userId: string): Promise<IProject | null> {
    return Project.findOneAndUpdate(
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
export default ProjectRepository;
