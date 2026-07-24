import { create } from 'zustand';

interface CurrencyState {
  rates: Record<string, number>;
  baseCurrency: string;
  isLoading: boolean;
  fetchRates: () => Promise<void>;
  convert: (amount: number, from: string, to: string) => number;
}

export const guessCurrencyFromTimezone = (): string => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  if (
    tz.includes('Europe') ||
    tz.includes('Madrid') ||
    tz.includes('Paris') ||
    tz.includes('Berlin') ||
    tz.includes('Rome')
  ) {
    return 'EUR';
  }
  if (tz.includes('Buenos_Aires') || tz.includes('Argentina')) {
    return 'ARS';
  }
  if (tz.includes('Mexico')) {
    return 'MXN';
  }
  if (tz.includes('Bogota') || tz.includes('Colombia')) {
    return 'COP';
  }
  if (tz.includes('Santiago') || tz.includes('Chile')) {
    return 'CLP';
  }
  if (tz.includes('Lima') || tz.includes('Peru')) {
    return 'PEN';
  }
  return 'USD';
};

export const currencyStore = create<CurrencyState>((set, get) => ({
  rates: {
    USD: 1.0,
    EUR: 0.92,
    ARS: 925.0,
    MXN: 18.0,
    COP: 4020.0,
    CLP: 930.0,
    PEN: 3.73,
  },
  baseCurrency: 'USD',
  isLoading: false,

  fetchRates: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates) {
        set({ rates: data.rates, baseCurrency: data.base_code || 'USD' });
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rates, using local fallback:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  convert: (amount: number, from: string = 'USD', to: string = 'USD') => {
    if (!amount) return 0;
    const { rates } = get();
    
    // Normalize codes
    const fromCode = (from || 'USD').toUpperCase();
    const toCode = (to || 'USD').toUpperCase();

    if (fromCode === toCode) return amount;

    const fromRate = rates[fromCode] || 1;
    const toRate = rates[toCode] || 1;

    // Convert from source currency to base (USD), then to target currency
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  },
}));
