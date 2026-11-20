export type SmsMessage = {
  to: string;
  body: string;
};

export type SmsResult = {
  id: string;
  status: 'sent' | 'queued';
};

/** Swap this for an SMS gateway. The demo records the message and does not send it. */
export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsResult>;
}

class SimulatedSmsProvider implements SmsProvider {
  async send(): Promise<SmsResult> {
    return { id: `sms_${Date.now().toString(36)}`, status: 'queued' };
  }
}

export function getSmsProvider(): SmsProvider {
  return new SimulatedSmsProvider();
}
