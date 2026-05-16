export function paisaToCents(amountPaisa, inrToUsdRate = 0.012) {
  const rupees = amountPaisa / 100;
  const usd = rupees * inrToUsdRate;
  const cents = Math.round(usd * 100);
  return cents;
}

export function convertUSDToINR(
  amount: { value: number; currency: string; symbol: string },
  inrToUsdRate: number = 0.013
): { value: number; currency: string; symbol: string } {
  const inrValue = Math.round(amount.value / inrToUsdRate);
  return {
    value: inrValue,
    currency: 'INR',
    symbol: '₹'
  };
}
