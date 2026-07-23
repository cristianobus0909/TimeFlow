import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = env.MONGO_URI;
    await mongoose.connect(mongoUri);
    logger.info('✔ MongoDB conectado correctamente.');
  } catch (error) {
    logger.error('❌ Error de conexión a MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠ Conexión perdida con MongoDB. Reintentando...');
});

mongoose.connection.on('error', (error) => {
  logger.error('❌ Error en el canal de conexión de MongoDB:', error);
});
