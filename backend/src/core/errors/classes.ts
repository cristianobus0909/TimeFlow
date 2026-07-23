import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autenticado. Por favor, inicie sesión.') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No tiene permisos para acceder a este recurso.') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado.') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Ocurrió un error interno en el servidor.') {
    super(message, 500);
  }
}
