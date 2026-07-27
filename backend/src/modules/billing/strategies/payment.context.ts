import { IPaymentStrategy } from './payment.strategy';
import { MercadoPagoStrategy } from './mercadopago.strategy';

export class PaymentContext {
  private strategies: Map<string, IPaymentStrategy> = new Map();

  constructor() {
    this.registerStrategy(new MercadoPagoStrategy());
  }

  public registerStrategy(strategy: IPaymentStrategy): void {
    this.strategies.set(strategy.name.toLowerCase(), strategy);
  }

  public getStrategy(name: string): IPaymentStrategy {
    const strategy = this.strategies.get(name.toLowerCase());
    if (!strategy) {
      throw new Error(`Pasarela de pago no soportada: ${name}`);
    }
    return strategy;
  }
}

export const paymentContext = new PaymentContext();
