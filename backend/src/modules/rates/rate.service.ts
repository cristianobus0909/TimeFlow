import { RateRepository } from './rate.repository';
import { IRate } from './rate.model';
import { CreateRateInput, UpdateRateInput } from './rate.schema';
import { NotFoundError } from '@core/errors/classes';
import { Types } from 'mongoose';

export class RateService {
  private repository: RateRepository;

  constructor() {
    this.repository = new RateRepository();
  }

  public async getRates(orgId: string): Promise<IRate[]> {
    return this.repository.findAll(orgId);
  }

  public async getRateById(id: string, orgId: string): Promise<IRate> {
    const rate = await this.repository.findById(id, orgId);
    if (!rate) {
      throw new NotFoundError('Tarifa no encontrada.');
    }
    return rate;
  }

  public async createRate(data: CreateRateInput, orgId: string, userId: string): Promise<IRate> {
    const rate = await this.repository.create({
      ...data,
      complexity: data.complexity as any,
      category: new Types.ObjectId(data.category),
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(userId),
    });

    // If the new rate is active, deactivate other rates of the same category and complexity
    if (rate.active) {
      await this.repository.deactivateOlderRates(orgId, data.category, data.complexity, rate._id.toString());
    }

    return rate;
  }

  public async updateRate(
    id: string,
    orgId: string,
    data: UpdateRateInput,
    userId: string
  ): Promise<IRate> {
    const existing = await this.repository.findById(id, orgId);
    if (!existing) {
      throw new NotFoundError('Tarifa no encontrada o no autorizada.');
    }

    const updateData: any = { ...data };
    if (data.category) {
      updateData.category = new Types.ObjectId(data.category);
    }

    const updated = await this.repository.update(id, orgId, updateData, userId);
    if (!updated) {
      throw new NotFoundError('No se pudo actualizar la tarifa.');
    }

    // If updated to active, deactivate other rates
    if (updated.active) {
      await this.repository.deactivateOlderRates(
        orgId,
        updated.category._id.toString(),
        updated.complexity,
        updated._id.toString()
      );
    }

    return updated;
  }

  public async deleteRate(id: string, orgId: string, userId: string): Promise<void> {
    const rate = await this.repository.softDelete(id, orgId, userId);
    if (!rate) {
      throw new NotFoundError('Tarifa no encontrada o no autorizada.');
    }
  }
}
export default RateService;
