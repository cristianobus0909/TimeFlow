import { ClientRepository } from './client.repository';
import { IClient } from './client.model';
import { CreateClientInput, UpdateClientInput } from './client.schema';
import { NotFoundError } from '@core/errors/classes';
import { Types } from 'mongoose';

export class ClientService {
  private repository: ClientRepository;

  constructor() {
    this.repository = new ClientRepository();
  }

  public async getClients(orgId: string): Promise<IClient[]> {
    return this.repository.findAll(orgId);
  }

  public async getClientById(id: string, orgId: string): Promise<IClient> {
    const client = await this.repository.findById(id, orgId);
    if (!client) {
      throw new NotFoundError('Cliente no encontrado.');
    }
    return client;
  }

  public async createClient(data: CreateClientInput, orgId: string, userId: string): Promise<IClient> {
    const client = await this.repository.create({
      ...data,
      organization: new Types.ObjectId(orgId),
      createdBy: new Types.ObjectId(userId),
    });
    return client;
  }

  public async updateClient(
    id: string,
    orgId: string,
    data: UpdateClientInput,
    userId: string
  ): Promise<IClient> {
    const client = await this.repository.update(id, orgId, data as any, userId);
    if (!client) {
      throw new NotFoundError('Cliente no encontrado o no autorizado.');
    }
    return client;
  }

  public async deleteClient(id: string, orgId: string, userId: string): Promise<void> {
    const client = await this.repository.softDelete(id, orgId, userId);
    if (!client) {
      throw new NotFoundError('Cliente no encontrado o no autorizado.');
    }
  }
}
export default ClientService;
