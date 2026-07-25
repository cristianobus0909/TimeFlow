import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@core/middleware/auth.middleware';
import { User } from '@modules/users/user.model';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const mobbexApiKey = process.env.MOBBEX_API_KEY || '';
const mobbexAccessToken = process.env.MOBBEX_ACCESS_TOKEN || '';

const isMock = !stripeSecret || stripeSecret.includes('your_stripe_secret_key');
const stripe = isMock ? null : new Stripe(stripeSecret);

// Helper to calculate price depending on plan and currency
const getPlanPrice = (plan: string, gateway: 'stripe' | 'mercadopago' | 'mobbex') => {
  if (gateway === 'stripe') {
    // Stripe prices in USD
    if (plan === 'freelancer') return 15;
    if (plan === 'pro') return 25;
    if (plan === 'business') return 45;
  } else {
    // Mercado Pago / Mobbex prices in ARS
    if (plan === 'freelancer') return 15000;
    if (plan === 'pro') return 25000;
    if (plan === 'business') return 45000;
  }
  return 0;
};

// --- STRIPE CHECKOUT ---
export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { plan = 'pro' } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // MOCK UPGRADE (For local testing without Stripe key)
    if (isMock) {
      user.subscriptionPlan = plan;
      user.subscriptionStatus = 'active';
      user.subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await user.save();

      res.status(200).json({
        url: `${frontendUrl}/dashboard?billing_success=true&mock=true&plan=${plan}`,
        message: 'Upgrade simulado con éxito (Stripe Mock).',
      });
      return;
    }

    if (!stripe) {
      res.status(500).json({ error: 'El servicio de facturación no está configurado.' });
      return;
    }

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

    const priceAmount = getPlanPrice(plan, 'stripe');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `TimeFlow ${plan.toUpperCase()} Plan`,
              description: `Acceso segmentado al plan ${plan} de TimeFlow.`,
            },
            unit_amount: priceAmount * 100, // in cents
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${frontendUrl}/dashboard?billing_success=true&plan=${plan}`,
      cancel_url: `${frontendUrl}/pricing?billing_canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: 'Error al iniciar la sesión de pago.' });
  }
};

export const createPortalSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    if (isMock) {
      user.subscriptionPlan = 'free';
      user.subscriptionStatus = 'free';
      await user.save();

      res.status(200).json({
        url: `${frontendUrl}/settings?billing_downgraded=true&mock=true`,
        message: 'Cancelación simulada con éxito.',
      });
      return;
    }

    if (!stripe || !user.stripeCustomerId) {
      res.status(400).json({ error: 'El usuario no tiene un perfil de facturación activo.' });
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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Detect plan based on amount charged
        const lineItem = session.line_items?.data[0];
        const unitAmount = lineItem?.price?.unit_amount || 0;
        let plan: 'freelancer' | 'pro' | 'business' = 'pro';
        if (unitAmount === 1500) plan = 'freelancer';
        else if (unitAmount === 4500) plan = 'business';

        await User.findOneAndUpdate(
          { stripeCustomerId: customerId },
          {
            subscriptionPlan: plan,
            subscriptionStatus: 'active',
            subscriptionId,
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
            subscriptionStatus: 'free',
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

// --- MERCADO PAGO CHECKOUT ---
export const createMercadoPagoCheckout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { plan = 'pro' } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const isMpMock = !mpToken || mpToken.includes('TEST-');

    // MERCADO PAGO MOCK UPGRADE
    if (isMpMock) {
      user.subscriptionPlan = plan;
      user.subscriptionStatus = 'active';
      user.subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await user.save();

      res.status(200).json({
        url: `${frontendUrl}/dashboard?billing_success=true&mock=true&gateway=mercadopago&plan=${plan}`,
        message: 'Upgrade simulado con éxito (Mercado Pago Mock).',
      });
      return;
    }

    const price = getPlanPrice(plan, 'mercadopago');

    // Create Preference using Node.js global fetch
    const backendUrl = process.env.BACKEND_URL || 'https://timeflow-backend.onrender.com';
    const preference = {
      items: [
        {
          title: `TimeFlow ${plan.toUpperCase()}`,
          quantity: 1,
          unit_price: price,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: user.email,
        name: user.name,
      },
      back_urls: {
        success: `${frontendUrl}/dashboard?billing_success=true&gateway=mercadopago&plan=${plan}`,
        failure: `${frontendUrl}/pricing?billing_canceled=true`,
        pending: `${frontendUrl}/dashboard?billing_pending=true`,
      },
      auto_return: 'approved',
      notification_url: `${backendUrl}/api/v1/billing/mercadopago/webhook?userId=${user._id}&plan=${plan}`,
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error creating preference at Mercado Pago');
    }

    res.status(200).json({ url: data.init_point });
  } catch (error: any) {
    console.error('Error creating Mercado Pago Preference:', error);
    res.status(500).json({ error: error.message || 'Error al iniciar la sesión de Mercado Pago.' });
  }
};

export const handleMercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, plan } = req.query;
    const body = req.body;

    const paymentId = body.data?.id || body.id;
    const type = body.type || body.topic;

    if (type === 'payment' && paymentId && userId && plan) {
      // Verify payment with Mercado Pago API using global fetch
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${mpToken}`,
        },
      });

      const paymentData: any = await paymentResponse.json();

      if (paymentResponse.ok && paymentData.status === 'approved') {
        await User.findByIdAndUpdate(userId, {
          subscriptionPlan: plan as string,
          subscriptionStatus: 'active',
          subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        console.log(`✅ Upgrade del usuario ${userId} al plan ${plan} realizado mediante Mercado Pago.`);
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error en webhook de Mercado Pago:', error);
    res.status(500).send('Internal Webhook Error');
  }
};

// --- MOBBEX CHECKOUT ---
export const createMobbexCheckout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { plan = 'pro' } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    const isMobbexMock = !mobbexApiKey || !mobbexAccessToken;

    // MOBBEX MOCK UPGRADE
    if (isMobbexMock) {
      user.subscriptionPlan = plan;
      user.subscriptionStatus = 'active';
      user.subscriptionPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await user.save();

      res.status(200).json({
        url: `${frontendUrl}/dashboard?billing_success=true&mock=true&gateway=mobbex&plan=${plan}`,
        message: 'Upgrade simulado con éxito (Mobbex Mock).',
      });
      return;
    }

    const price = getPlanPrice(plan, 'mobbex');
    const backendUrl = process.env.BACKEND_URL || 'https://timeflow-backend.onrender.com';

    const checkoutBody = {
      total: price,
      currency: 'ARS',
      reference: `${user._id}_${plan}`,
      description: `Suscripción TimeFlow plan ${plan}`,
      return_url: `${frontendUrl}/dashboard?billing_success=true&gateway=mobbex&plan=${plan}`,
      webhook: `${backendUrl}/api/v1/billing/mobbex/webhook`,
      customer: {
        name: user.name,
        email: user.email,
      },
    };

    const response = await fetch('https://api.mobbex.com/p/checkout', {
      method: 'POST',
      headers: {
        'x-api-key': mobbexApiKey,
        'x-access-token': mobbexAccessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutBody),
    });

    const data: any = await response.json();
    if (!response.ok || !data.result) {
      throw new Error(data.message || 'Error creating checkout at Mobbex');
    }

    res.status(200).json({ url: data.data.url });
  } catch (error: any) {
    console.error('Error creating Mobbex checkout:', error);
    res.status(500).json({ error: error.message || 'Error al iniciar la sesión de Mobbex.' });
  }
};

export const handleMobbexWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = req.body as any;

    if (data && data.payment && data.payment.status && data.payment.status.code === 200) {
      const reference = data.payment.reference as string; // user_id + "_" + plan
      const [userId, plan] = reference.split('_');

      if (userId && plan) {
        await User.findByIdAndUpdate(userId, {
          subscriptionPlan: plan,
          subscriptionStatus: 'active',
          subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        console.log(`✅ Upgrade del usuario ${userId} al plan ${plan} realizado mediante Mobbex.`);
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error en webhook de Mobbex:', error);
    res.status(500).send('Internal Webhook Error');
  }
};
