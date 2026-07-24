import { Client, IClient } from './client.model';
import { Types } from 'mongoose';

export class ClientRepository {
  public async findById(id: string, orgId: string): Promise<IClient | null> {
    return Client.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    });
  }

  public async findAll(orgId: string): Promise<IClient[]> {
    return Client.find({
      organization: new Types.ObjectId(orgId),
    });
  }

  public async create(data: Partial<IClient>): Promise<IClient> {
    const client = new Client(data);
    return client.save();
  }

  public async update(
    id: string,
    orgId: string,
    data: Partial<IClient>,
    userId: string
  ): Promise<IClient | null> {
    return Client.findOneAndUpdate(
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
    );
  }

  public async softDelete(id: string, orgId: string, userId: string): Promise<IClient | null> {
    return Client.findOneAndUpdate(
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
export default ClientRepository;
