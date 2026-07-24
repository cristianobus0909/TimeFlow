import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'El nombre de la organización es obligatorio.'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones.').optional(),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
  country: z.string().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones.').optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED']).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
