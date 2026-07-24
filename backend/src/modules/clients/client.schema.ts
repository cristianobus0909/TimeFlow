import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'El nombre del cliente es obligatorio.'),
  company: z.string().optional(),
  email: z.string().email('El formato del correo electrónico es inválido.').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  color: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  email: z.string().email('El formato del correo electrónico es inválido.').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
