import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '@config/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ocurrió un error inesperado en el servidor.';

  // Log the error depending on its type
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(`❌ AppError Inesperado: ${err.message}`, err);
    } else {
      logger.warn(`⚠ AppError Operacional [${statusCode}]: ${err.message}`);
    }
  } else {
    logger.error(`💥 Error de Sistema: ${err.message}`, err);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
