import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { OAuth2Client } from 'google-auth-library';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schema';
import { Settings } from '../settings/settings.model';
import { IUser } from '../users/user.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@shared/utils/jwt';
import { 
  ConflictError, 
  AuthenticationError, 
  ValidationError, 
  NotFoundError 
} from '@core/errors/classes';
import { logger } from '@config/logger';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  public async register(data: RegisterInput): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const { name, email, password } = data;

    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('El correo electrónico ya está registrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let stripeCustomerId = undefined;
    if (stripe) {
      try {
        const customer = await stripe.customers.create({
          email,
          name,
          metadata: { app: 'TimeFlow' },
        });
        stripeCustomerId = customer.id;
      } catch (stripeError) {
        logger.error('⚠ Error al registrar cliente en Stripe (continuando registro local):', stripeError);
      }
    }

    const user = await this.repository.create({
      name,
      email,
      passwordHash,
      stripeCustomerId,
      subscriptionPlan: 'free',
      subscriptionStatus: 'free',
    });

    const settings = new Settings({
      userId: user._id,
    });
    await settings.save();

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await this.repository.save(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
      } as any,
      accessToken,
      refreshToken,
    };
  }

  public async login(data: LoginInput): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const { email, password } = data;

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Credenciales inválidas.');
    }

    if (!user.passwordHash) {
      throw new ValidationError('Esta cuenta está registrada con Google. Por favor, inicia sesión con Google o vincula una contraseña.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AuthenticationError('Credenciales inválidas.');
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await this.repository.save(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
      } as any,
      accessToken,
      refreshToken,
    };
  }

  public async refresh(token: string): Promise<{ accessToken: string }> {
    if (!token) {
      throw new AuthenticationError('Token de actualización no proporcionado.');
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      throw new AuthenticationError('Token de actualización inválido o expirado.');
    }

    const user = await this.repository.findById(payload.userId);
    if (!user || user.refreshToken !== token) {
      throw new AuthenticationError('Acceso denegado: Sesión no válida.');
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    return { accessToken: newAccessToken };
  }

  public async googleAuth(idToken: string): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      logger.error('❌ Error al verificar token de Google:', verifyError);
      throw new AuthenticationError('Token de Google inválido o expirado.');
    }

    if (!payload || !payload.email || !payload.name) {
      throw new ValidationError('El token de Google no contiene la información mínima requerida (email y nombre).');
    }

    const { email, name, sub: googleId } = payload;

    let user = await this.repository.findByEmail(email);

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await this.repository.save(user);
      }
    } else {
      let stripeCustomerId = undefined;
      if (stripe) {
        try {
          const customer = await stripe.customers.create({
            email,
            name,
            metadata: { app: 'TimeFlow' },
          });
          stripeCustomerId = customer.id;
        } catch (stripeError) {
          logger.error('⚠ Error al registrar cliente en Stripe (Google Auth):', stripeError);
        }
      }

      user = await this.repository.create({
        name,
        email,
        googleId,
        stripeCustomerId,
        subscriptionPlan: 'free',
        subscriptionStatus: 'free',
      });

      const settings = new Settings({
        userId: user._id,
      });
      await settings.save();
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await this.repository.save(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
      } as any,
      accessToken,
      refreshToken,
    };
  }

  public async logout(token: string): Promise<void> {
    if (!token) return;
    const user = await this.repository.findByRefreshToken(token);
    if (user) {
      user.refreshToken = undefined;
      await this.repository.save(user);
    }
  }
}
export default AuthService;
