import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@shared/utils/jwt';
import { User } from '@modules/users/user.model';
import { Organization } from '@modules/organizations/organization.model';

export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
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

    let orgIdStr = user.organization?.toString();
    if (!orgIdStr) {
      // Find or create default organization for this user
      let existingOrg = await Organization.findOne({ owner: user._id, isDeleted: false });
      if (!existingOrg) {
        existingOrg = await Organization.create({
          name: `Organización de ${user.name || 'Usuario'}`,
          owner: user._id,
        });
      }
      user.organization = existingOrg._id as any;
      await user.save();
      orgIdStr = existingOrg._id.toString();
    }

    req.user = {
      userId: payload.userId,
      organizationId: orgIdStr,
      role: user.role || 'OWNER',
    };
    next();
  } catch (error) {
    next(error);
  }
};
