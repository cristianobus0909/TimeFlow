import { z } from 'zod';

export const createProjectSchema = z.object({
  client: z.string().optional(),
  name: z.string().min(1, 'El nombre del proyecto es obligatorio.'),
  description: z.string().optional(),
  status: z.union([z.literal('PLANNING'), z.literal('ACTIVE'), z.literal('ON_HOLD'), z.literal('COMPLETED'), z.literal('CANCELLED')]).default('PLANNING'),
  priority: z.union([z.literal('LOW'), z.literal('MEDIUM'), z.literal('HIGH')]).default('MEDIUM'),
  budgetHours: z.number().min(0).optional(),
  budgetAmount: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
  client: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.union([z.literal('PLANNING'), z.literal('ACTIVE'), z.literal('ON_HOLD'), z.literal('COMPLETED'), z.literal('CANCELLED')]).optional(),
  priority: z.union([z.literal('LOW'), z.literal('MEDIUM'), z.literal('HIGH')]).optional(),
  budgetHours: z.number().min(0).optional(),
  budgetAmount: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
