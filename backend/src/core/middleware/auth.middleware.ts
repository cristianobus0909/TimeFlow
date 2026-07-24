import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@shared/utils/jwt';
import { User } from '@modules/users/user.model';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    organizationId?: string;
    role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado.' });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Acceso no autorizado: Token inválido o expirado.' });
    return;
  }

  try {
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'Acceso no autorizado: Usuario no encontrado.' });
      return;
    }

    req.user = {
      userId: payload.userId,
      organizationId: user.organization?.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};
