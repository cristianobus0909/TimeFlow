import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { OAuth2Client } from 'google-auth-library';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schema';
import { Settings } from '../settings/settings.model';
import { IUser } from '../users/user.model';
import { Organization } from '../organizations/organization.model';
import { seedDatabase } from '@config/seeds';
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

  private async createDefaultOrganization(user: any): Promise<any> {
    const slug = `workspace-${user._id.toString().substring(18)}`;
    const org = new Organization({
      name: `${user.name} Workspace`,
      slug,
      owner: user._id,
      status: 'TRIAL',
      createdBy: user._id,
    });
    await org.save();

    // Populate default tenant categories/rates
    await seedDatabase(org._id.toString());

    // Update user role and link organization
    user.organization = org._id;
    user.role = 'OWNER';
    await this.repository.save(user);

    // Migrate any legacy projects, tasks and work sessions belonging to this user
    try {
      const { Project } = await import('../projects/project.model.js');
      const { Task } = await import('../tasks/task.model.js');
      const { WorkSession } = await import('../workSessions/work-session.model.js');

      await Project.updateMany({ createdBy: user._id, organization: { $exists: false } }, { $set: { organization: org._id } });
      await Task.updateMany({ createdBy: user._id, organization: { $exists: false } }, { $set: { organization: org._id } });
      await WorkSession.updateMany({ user: user._id, organization: { $exists: false } }, { $set: { organization: org._id } });
    } catch (e) {
      logger.error('⚠ Error al migrar datos legacy de organización:', e);
    }

    return org;
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

    // Create default organization workspace
    await this.createDefaultOrganization(user);

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

    // Auto-create organization for legacy users on-the-fly
    if (!user.organization) {
      await this.createDefaultOrganization(user);
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
      // Auto-create organization for legacy users logging in with Google
      if (!user.organization) {
        await this.createDefaultOrganization(user);
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

      // Create default organization
      await this.createDefaultOrganization(user);
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
