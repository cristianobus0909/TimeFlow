import { IPaymentStrategy, PaymentCheckoutOptions, PaymentCheckoutResult } from './payment.strategy';
import { User } from '@modules/users/user.model';

export class MercadoPagoStrategy implements IPaymentStrategy {
  public readonly name = 'mercadopago';

  private getPlanPrice(plan: string): number {
    if (plan === 'freelancer') return 15000;
    if (plan === 'pro') return 25000;
    if (plan === 'business') return 45000;
    return 25000;
  }

  public async createCheckout(options: PaymentCheckoutOptions): Promise<PaymentCheckoutResult> {
    const { userId, userEmail, userName, plan, frontendUrl, backendUrl } = options;
    const currentMpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    const isMpMock = !currentMpToken || currentMpToken.includes('your_mercadopago_access_token_here');

    if (isMpMock) {
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      return {
        url: `${frontendUrl}/dashboard?billing_success=true&mock=true&gateway=mercadopago&plan=${plan}`,
        isMock: true,
        message: 'Upgrade simulado con éxito (Mercado Pago Mock).',
      };
    }

    const price = this.getPlanPrice(plan);
    const preference: any = {
      items: [
        {
          title: `TimeFlow ${plan.toUpperCase()}`,
          quantity: 1,
          unit_price: price,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: userEmail,
        name: userName,
      },
      back_urls: {
        success: `${frontendUrl}/dashboard?billing_success=true&gateway=mercadopago&plan=${plan}`,
        failure: `${frontendUrl}/pricing?billing_canceled=true`,
        pending: `${frontendUrl}/dashboard?billing_pending=true`,
      },
      external_reference: `${userId}_${plan}_${Date.now()}`,
      notification_url: `${backendUrl}/api/v1/billing/mercadopago/webhook?userId=${userId}&plan=${plan}`,
    };

    if (frontendUrl.startsWith('https')) {
      preference.auto_return = 'approved';
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentMpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data: any = await response.json();
    if (!response.ok) {
      console.error('❌ Error de Mercado Pago API:', data);
      throw new Error(data.message || data.error || 'Error al crear preferencia en Mercado Pago.');
    }

    const isSandbox = currentMpToken.startsWith('TEST-');
    const redirectUrl = isSandbox ? data.sandbox_init_point : data.init_point;
    return { url: redirectUrl || data.init_point };
  }
}
