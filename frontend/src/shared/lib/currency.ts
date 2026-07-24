export const getCurrencySymbol = (currencyCode?: string): string => {
  switch (currencyCode) {
    case 'EUR':
      return '€';
    case 'PEN':
      return 'S/.';
    case 'ARS':
    case 'MXN':
    case 'COP':
    case 'CLP':
    case 'USD':
    default:
      return '$';
  }
};
