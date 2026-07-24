import { z } from 'zod';

export const createRateSchema = z.object({
  category: z.string().min(1, 'La categoría es obligatoria.'),
  complexity: z.union([z.literal('LOW'), z.literal('MEDIUM'), z.literal('HIGH')]),
  hourlyRate: z.number().min(0, 'La tarifa horaria debe ser mayor o igual a 0.'),
  currency: z.string().default('USD'),
  effectiveFrom: z.coerce.date().optional(),
  active: z.boolean().default(true),
});

export const updateRateSchema = z.object({
  category: z.string().min(1).optional(),
  complexity: z.union([z.literal('LOW'), z.literal('MEDIUM'), z.literal('HIGH')]).optional(),
  hourlyRate: z.number().min(0).optional(),
  currency: z.string().optional(),
  effectiveFrom: z.coerce.date().optional(),
  active: z.boolean().optional(),
});

export type CreateRateInput = z.infer<typeof createRateSchema>;
export type UpdateRateInput = z.infer<typeof updateRateSchema>;
