import { OrganizationRepository } from './organization.repository';
import { IOrganization } from './organization.model';
import { CreateOrganizationInput, UpdateOrganizationInput } from './organization.schema';
import { User } from '../users/user.model';
import { ConflictError, NotFoundError } from '@core/errors/classes';
import { Types } from 'mongoose';
import { seedDatabase } from '@config/seeds';

export class OrganizationService {
  private repository: OrganizationRepository;

  constructor() {
    this.repository = new OrganizationRepository();
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-'); // Replace multiple - with single -
  }

  public async getOrganizationById(id: string): Promise<IOrganization> {
    const org = await this.repository.findById(id);
    if (!org) {
      throw new NotFoundError('Organización no encontrada.');
    }
    return org;
  }

  public async getOrganizationByOwner(ownerId: string): Promise<IOrganization> {
    const org = await this.repository.findByOwner(ownerId);
    if (!org) {
      throw new NotFoundError('Este usuario no tiene una organización asociada.');
    }
    return org;
  }

  public async createOrganization(data: CreateOrganizationInput, ownerId: string): Promise<IOrganization> {
    const slug = data.slug ? this.slugify(data.slug) : this.slugify(data.name);

    // Check if slug is unique
    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new ConflictError('El slug de la organización ya está en uso. Por favor, elija otro.');
    }

    const org = await this.repository.create({
      ...data,
      slug,
      owner: new Types.ObjectId(ownerId),
      status: 'TRIAL',
      createdBy: new Types.ObjectId(ownerId),
    });

    // Populate default tenant categories
    await seedDatabase(org._id.toString());

    // Update user organization & role
    await User.findByIdAndUpdate(ownerId, {
      $set: {
        organization: org._id,
        role: 'OWNER',
      },
    });

    return org;
  }

  public async updateOrganization(id: string, data: UpdateOrganizationInput, userId: string): Promise<IOrganization> {
    const org = await this.repository.findById(id);
    if (!org) {
      throw new NotFoundError('Organización no encontrada.');
    }

    // If changing slug, verify uniqueness
    if (data.slug) {
      const slug = this.slugify(data.slug);
      const existing = await this.repository.findBySlug(slug);
      if (existing && existing._id.toString() !== id) {
        throw new ConflictError('El slug ya está en uso por otra organización.');
      }
      data.slug = slug;
    }

    const updated = await this.repository.update(id, data as any, userId);
    if (!updated) {
      throw new NotFoundError('No se pudo actualizar la organización.');
    }
    return updated;
  }

  public async deleteOrganization(id: string, userId: string): Promise<void> {
    const org = await this.repository.findById(id);
    if (!org) {
      throw new NotFoundError('Organización no encontrada.');
    }

    await this.repository.softDelete(id, userId);

    // Disconnect users associated with this organization
    await User.updateMany(
      { organization: new Types.ObjectId(id) },
      { $unset: { organization: '' }, $set: { role: 'MEMBER' } }
    );
  }
}
export default OrganizationService;
