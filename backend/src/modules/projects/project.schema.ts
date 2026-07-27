import { z } from 'zod';

const preprocessDate = (val: unknown) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return val;
};

const preprocessPriority = (val: unknown) => {
  if (typeof val === 'string') {
    const upper = val.toUpperCase();
    if (['LOW', 'MEDIUM', 'HIGH'].includes(upper)) return upper;
  }
  return val;
};

const preprocessStatus = (val: unknown) => {
  if (typeof val === 'string') {
    const upper = val.toUpperCase();
    if (['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].includes(upper)) return upper;
  }
  return val;
};

export const createProjectSchema = z.object({
  client: z.string().optional(),
  name: z.string().min(1, 'El nombre del proyecto es obligatorio.'),
  description: z.string().optional(),
  status: z.preprocess(preprocessStatus, z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING')),
  priority: z.preprocess(preprocessPriority, z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')),
  budgetHours: z.number().min(0).optional(),
  budgetAmount: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  startDate: z.preprocess(preprocessDate, z.coerce.date().optional()),
  endDate: z.preprocess(preprocessDate, z.coerce.date().optional()),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
  client: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.preprocess(preprocessStatus, z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional()),
  priority: z.preprocess(preprocessPriority, z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()),
  budgetHours: z.number().min(0).optional(),
  budgetAmount: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  startDate: z.preprocess(preprocessDate, z.coerce.date().optional()),
  endDate: z.preprocess(preprocessDate, z.coerce.date().optional()),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
