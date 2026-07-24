import { z } from 'zod';

export const createTaskSchema = z.object({
  project: z.string().optional(),
  assignedTo: z.string().optional(),
  title: z.string().min(1, 'El título de la tarea es obligatorio.'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es obligatoria.'),
  priority: z.union([z.literal('LOW'), z.literal('MEDIUM'), z.literal('HIGH')]).default('MEDIUM'),
  status: z.union([
    z.literal('active'),
    z.literal('completed'),
    z.literal('archived'),
    z.literal('TODO'),
    z.literal('IN_PROGRESS'),
    z.literal('BLOCKED'),
    z.literal('DONE')
  ]).default('TODO'),
  estimatedHours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  project: z.string().optional(),
  assignedTo: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  priority: z.union([z.literal('LOW'), z.literal('MEDIUM'), z.literal('HIGH')]).optional(),
  status: z.union([
    z.literal('active'),
    z.literal('completed'),
    z.literal('archived'),
    z.literal('TODO'),
    z.literal('IN_PROGRESS'),
    z.literal('BLOCKED'),
    z.literal('DONE')
  ]).optional(),
  estimatedHours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
