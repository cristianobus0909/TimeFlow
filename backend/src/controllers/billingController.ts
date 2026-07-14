import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { User } from '../models/User';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const isMock = !stripeSecret || stripeSecret.includes('MockStripeKey');
const stripe = isMock ? null : new Stripe(stripeSecret);

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // MOCK UPGRADE (For local testing without Stripe key setup)
    if (isMock) {
      user.subscriptionPlan = 'pro';
      user.subscriptionStatus = 'active';
      user.subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await user.save();

      res.status(200).json({
        url: `${frontendUrl}/dashboard?billing_success=true&mock=true`,
        message: 'Upgrade Pro simulado con éxito (Entorno de desarrollo local).',
      });
      return;
    }

    // REAL STRIPE CHECKOUT
    if (!stripe) {
      res.status(500).json({ error: 'El servicio de facturación no está configurado.' });
      return;
    }

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session for recurring subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          // We can dynamically create a product on Stripe or use standard parameters
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'TimeFlow Pro Plan',
              description: 'Acceso ilimitado a proyectos, tareas y estimaciones inteligentes ponderadas.',
            },
            unit_amount: 900, // $9.00 USD
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${frontendUrl}/dashboard?billing_success=true`,
      cancel_url: `${frontendUrl}/pricing?billing_canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Error al iniciar la sesión de pago.' });
  }
};

export const createPortalSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
      res.status(400).json({ error: 'El usuario no tiene un perfil de facturación activo.' });
      return;
    }

    if (isMock) {
      // Mock Downgrade to Free
      user.subscriptionPlan = 'free';
      user.subscriptionStatus = 'free';
      await user.save();

      res.status(200).json({
        url: `${frontendUrl}/settings?billing_downgraded=true&mock=true`,
        message: 'Cancelación Pro simulada con éxito (Entorno de desarrollo local).',
      });
      return;
    }

    if (!stripe) {
      res.status(500).json({ error: 'El servicio de facturación no está disponible.' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/settings`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: 'Error al abrir el portal de facturación.' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  if (isMock) {
    res.status(200).send('Webhook mock success');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  if (!stripe) {
    res.status(500).send('Stripe not initialized');
    return;
  }

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Error de Firma:`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    // Process Stripe Webhook Events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Fetch subscription to get end date
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          {
            subscriptionPlan: 'pro',
            subscriptionStatus: 'active',
            subscriptionId,
            subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          }
        );
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await User.findOneAndUpdate(
            { stripeCustomerId: customerId },
            {
              subscriptionPlan: 'pro',
              subscriptionStatus: 'active',
              subscriptionId,
              subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            }
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const isCanceled = subscription.status === 'canceled' || subscription.cancel_at_period_end;

        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          {
            subscriptionStatus: subscription.status,
            subscriptionPlan: subscription.status === 'active' ? 'pro' : 'free',
            subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          {
            subscriptionPlan: 'free',
            subscriptionStatus: 'canceled',
            subscriptionId: undefined,
            subscriptionPeriodEnd: undefined,
          }
        );
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling stripe webhook event:', error);
    res.status(500).send('Internal Webhook Error');
  }
};
