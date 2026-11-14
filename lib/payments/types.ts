export type MobileMoneyNetwork = 'mtn' | 'airtel' | 'zamtel';

export type PayoutNetwork = MobileMoneyNetwork | 'bank';

export type TopUpRequest = {
  network: MobileMoneyNetwork;
  phone: string;
  amountNgwee: number;
  reference: string;
  passengerId: string;
};

export type PayoutRequest = {
  network: PayoutNetwork;
  destination: string;
  amountNgwee: number;
  reference: string;
  ownerId: string;
};

export type ProviderResult = {
  ok: boolean;
  providerRef: string;
  message: string;
};

/**
 * Plug a real aggregator in here. It should collect from MTN MoMo, Airtel Money
 * and Zamtel Kwacha, then settle into the Twende wallet. The simulated provider
 * is the default so the demo runs with no credentials.
 */
export interface PaymentProvider {
  id: string;
  displayName: string;
  topUp(request: TopUpRequest): Promise<ProviderResult>;
  payout(request: PayoutRequest): Promise<ProviderResult>;
}
