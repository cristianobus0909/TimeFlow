import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  email: z.string().min(1, 'El correo electrónico es obligatorio.').email('El formato del correo electrónico es inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es obligatorio.').email('El formato del correo electrónico es inválido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'El ID Token de Google es obligatorio.'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
