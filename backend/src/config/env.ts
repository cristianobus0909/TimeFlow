import { z } from 'zod';
import dotenv from 'dotenv';

// Ensure env variables are loaded
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'La variable de entorno MONGO_URI es obligatoria y no puede estar vacía.'),
  JWT_SECRET: z.string().min(1, 'La variable de entorno JWT_SECRET es obligatoria y no puede estar vacía.'),
  JWT_REFRESH_SECRET: z.string().min(1, 'La variable de entorno JWT_REFRESH_SECRET es obligatoria y no puede estar vacía.'),
  FRONTEND_URL: z.string().min(1, 'La variable de entorno FRONTEND_URL es obligatoria y no puede estar vacía.'),
  STRIPE_SECRET_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Error de validación en las variables de entorno de TimeFlow:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type EnvType = z.infer<typeof envSchema>;
