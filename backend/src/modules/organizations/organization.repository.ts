import { Organization, IOrganization } from './organization.model';
import { Types } from 'mongoose';

export class OrganizationRepository {
  public async findById(id: string): Promise<IOrganization | null> {
    return Organization.findById(id);
  }

  public async findBySlug(slug: string): Promise<IOrganization | null> {
    return Organization.findOne({ slug });
  }

  public async findByOwner(ownerId: string): Promise<IOrganization | null> {
    return Organization.findOne({ owner: new Types.ObjectId(ownerId) });
  }

  public async create(data: Partial<IOrganization>): Promise<IOrganization> {
    const org = new Organization(data);
    return org.save();
  }

  public async update(id: string, data: Partial<IOrganization>, userId: string): Promise<IOrganization | null> {
    return Organization.findByIdAndUpdate(
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

  public async softDelete(id: string, userId: string): Promise<IOrganization | null> {
    return Organization.findByIdAndUpdate(
      id,
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
export default OrganizationRepository;
