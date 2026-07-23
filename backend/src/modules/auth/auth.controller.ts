import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, googleAuthSchema } from './auth.schema';
import { ValidationError } from '@core/errors/classes';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const { user, accessToken, refreshToken } = await this.service.register(result.data);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        message: 'Usuario registrado con éxito.',
        accessToken,
        user,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const { user, accessToken, refreshToken } = await this.service.login(result.data);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: 'Inicio de sesión exitoso.',
        accessToken,
        user,
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.refreshToken;
      const { accessToken } = await this.service.refresh(token);

      res.status(200).json({ accessToken });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.refreshToken;
      await this.service.logout(token);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      res.status(200).json({ message: 'Sesión cerrada correctamente.' });
    } catch (error) {
      next(error);
    }
  };

  public googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = googleAuthSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0].message);
      }

      const { user, accessToken, refreshToken } = await this.service.googleAuth(result.data.idToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: 'Autenticación con Google exitosa.',
        accessToken,
        user,
      });
    } catch (error) {
      next(error);
    }
  };
}
export default AuthController;
