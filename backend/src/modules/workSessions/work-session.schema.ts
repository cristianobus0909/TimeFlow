import { z } from 'zod';

export const startWorkSessionSchema = z.object({
  client: z.string().optional(),
  project: z.string().optional(),
  task: z.string().min(1, 'El ID de la tarea es obligatorio.'),
  category: z.string().min(1, 'La categoría es obligatoria.'),
  complexity: z.union([z.literal('LOW'), z.literal('MEDIUM'), z.literal('HIGH')]).default('MEDIUM'),
  startTime: z.coerce.date().optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  device: z.string().optional(),
  billable: z.boolean().optional(),
});

export const finishWorkSessionSchema = z.object({
  endTime: z.coerce.date().optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
});

export const dailyGoalSchema = z.object({
  targetHours: z.number().min(0, 'Las horas objetivo deben ser mayores o iguales a 0.'),
  targetAmount: z.number().min(0, 'El valor objetivo debe ser mayor o igual a 0.'),
  date: z.coerce.date().optional(),
});

export type StartWorkSessionInput = z.infer<typeof startWorkSessionSchema>;
export type FinishWorkSessionInput = z.infer<typeof finishWorkSessionSchema>;
export type DailyGoalInput = z.infer<typeof dailyGoalSchema>;
