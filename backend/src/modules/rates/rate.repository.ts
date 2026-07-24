import { Rate, IRate } from './rate.model';
import { Types } from 'mongoose';

export class RateRepository {
  public async findById(id: string, orgId: string): Promise<IRate | null> {
    return Rate.findOne({
      _id: new Types.ObjectId(id),
      organization: new Types.ObjectId(orgId),
    }).populate('category');
  }

  public async findAll(orgId: string): Promise<IRate[]> {
    return Rate.find({
      organization: new Types.ObjectId(orgId),
    }).populate('category');
  }

  public async findActiveByCategoryAndComplexity(
    orgId: string,
    categoryId: string,
    complexity: string
  ): Promise<IRate | null> {
    return Rate.findOne({
      organization: new Types.ObjectId(orgId),
      category: new Types.ObjectId(categoryId),
      complexity,
      active: true,
    });
  }

  public async create(data: Partial<IRate>): Promise<IRate> {
    const rate = new Rate(data);
    return rate.save();
  }

  public async update(
    id: string,
    orgId: string,
    data: Partial<IRate>,
    userId: string
  ): Promise<IRate | null> {
    return Rate.findOneAndUpdate(
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
    ).populate('category');
  }

  public async deactivateOlderRates(
    orgId: string,
    categoryId: string,
    complexity: string,
    exceptId?: string
  ): Promise<void> {
    const query: any = {
      organization: new Types.ObjectId(orgId),
      category: new Types.ObjectId(categoryId),
      complexity,
      active: true,
    };
    if (exceptId) {
      query._id = { $ne: new Types.ObjectId(exceptId) };
    }

    await Rate.updateMany(query, {
      $set: { active: false },
    });
  }

  public async softDelete(id: string, orgId: string, userId: string): Promise<IRate | null> {
    return Rate.findOneAndUpdate(
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
export default RateRepository;
