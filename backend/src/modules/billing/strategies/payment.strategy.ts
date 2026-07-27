export interface PaymentCheckoutOptions {
  userId: string;
  userEmail: string;
  userName: string;
  plan: 'freelancer' | 'pro' | 'business';
  frontendUrl: string;
  backendUrl: string;
}

export interface PaymentCheckoutResult {
  url: string;
  isMock?: boolean;
  message?: string;
}

export interface IPaymentStrategy {
  readonly name: string;
  createCheckout(options: PaymentCheckoutOptions): Promise<PaymentCheckoutResult>;
}
