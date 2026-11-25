import { SimulatedPaymentProvider } from './simulated';
import type { PaymentProvider } from './types';

export type { MobileMoneyNetwork, PaymentProvider, PayoutNetwork, PayoutRequest, ProviderResult, TopUpRequest } from './types';

/**
 * Returns the active payment provider.
 * The current provider is for the demo environment. Live partner payments
 * must use authenticated confirmations and the separate collection journal.
 */
export function getPaymentProvider(): PaymentProvider {
  if (process.env.TWENDE_ENV === 'production') throw new Error('A live payment provider is not configured.');
  const which = process.env.PAYMENT_PROVIDER ?? 'simulated';
  if (which !== 'simulated') {
    throw new Error(
      `Payment provider "${which}" is not configured. Add an adapter in lib/payments and select it here.`,
    );
  }
  return new SimulatedPaymentProvider();
}
