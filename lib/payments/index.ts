import { SimulatedPaymentProvider } from './simulated';
import type { PaymentProvider } from './types';

export type { MobileMoneyNetwork, PaymentProvider, PayoutNetwork, PayoutRequest, ProviderResult, TopUpRequest } from './types';

/**
 * Returns the active payment provider.
 * Set PAYMENT_PROVIDER and construct a real adapter (for example a MoMo /
 * Airtel / Zamtel aggregator) beside SimulatedPaymentProvider when going live.
 * Never commit aggregator credentials.
 */
export function getPaymentProvider(): PaymentProvider {
  const which = process.env.PAYMENT_PROVIDER ?? 'simulated';
  if (which !== 'simulated') {
    throw new Error(
      `Payment provider "${which}" is not configured. Add an adapter in lib/payments and select it here.`,
    );
  }
  return new SimulatedPaymentProvider();
}
