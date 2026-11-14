import type { PaymentProvider, PayoutRequest, ProviderResult, TopUpRequest } from './types';

function reference(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const noise = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${noise}`;
}

/** Stand-in for a Zambian mobile-money aggregator. Always succeeds. */
export class SimulatedPaymentProvider implements PaymentProvider {
  id = 'simulated';
  displayName = 'Simulated aggregator';

  async topUp(request: TopUpRequest): Promise<ProviderResult> {
    if (request.amountNgwee < 100) {
      return { ok: false, providerRef: '', message: 'The smallest top-up is K1.' };
    }
    return {
      ok: true,
      providerRef: reference('SIM'),
      message: 'Simulated mobile-money top-up accepted.',
    };
  }

  async payout(request: PayoutRequest): Promise<ProviderResult> {
    if (request.amountNgwee < 100) {
      return { ok: false, providerRef: '', message: 'The smallest payout is K1.' };
    }
    return {
      ok: true,
      providerRef: reference('PAY'),
      message: 'Simulated payout sent.',
    };
  }
}
