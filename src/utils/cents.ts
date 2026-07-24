export const toCents = (amount: number): number => Math.round(amount * 100);

export const toAmount = (cents: number): number => cents / 100;

export const fmtAmount = (cents: number): string =>
  'L. ' + toAmount(cents).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
