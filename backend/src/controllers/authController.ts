import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Settings } from '../models/Settings';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import Stripe from 'stripe';
import { OAuth2Client } from 'google-auth-library';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Todos los campos son obligatorios (nombre, email, contraseña).' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Attempt Stripe Customer registration
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
        console.error('⚠ Error al registrar cliente en Stripe (continuando registro local):', stripeError);
      }
    }

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      stripeCustomerId,
      subscriptionPlan: 'free',
      subscriptionStatus: 'free',
    });

    await user.save();

    // Create default settings for user
    const settings = new Settings({
      userId: user._id,
    });
    await settings.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'Usuario registrado con éxito.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor al registrar usuario.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son requeridos.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({ error: 'Esta cuenta está registrada con Google. Por favor, inicia sesión con Google o vincula una contraseña.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciales inválidas.' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'Token de actualización no proporcionado.' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(403).json({ error: 'Token de actualización inválido o expirado.' });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(403).json({ error: 'Acceso denegado: Sesión no válida.' });
      return;
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id.toString());
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(500).json({ error: 'Error al refrescar el token.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Find user and remove refresh token
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({ message: 'Sesión cerrada correctamente.' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'El ID Token de Google es requerido.' });
      return;
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.error('❌ Error al verificar token de Google:', verifyError);
      res.status(401).json({ error: 'Token de Google inválido o expirado.' });
      return;
    }

    if (!payload || !payload.email || !payload.name) {
      res.status(400).json({ error: 'El token de Google no contiene la información mínima requerida (email y nombre).' });
      return;
    }

    const { email, name, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Link account if Google ID not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Register user
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
          console.error('⚠ Error al registrar cliente en Stripe (Google Auth):', stripeError);
        }
      }

      user = new User({
        name,
        email,
        googleId,
        stripeCustomerId,
        subscriptionPlan: 'free',
        subscriptionStatus: 'free',
      });

      await user.save();

      // Create default settings for user
      const settings = new Settings({
        userId: user._id,
      });
      await settings.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Autenticación con Google exitosa.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error('Error en googleAuth:', error);
    res.status(500).json({ error: 'Error interno del servidor en la autenticación con Google.' });
  }
};
