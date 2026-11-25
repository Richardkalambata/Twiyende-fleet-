export function requiresOperatorSms(): boolean {
  return process.env.TWENDE_ENV === 'production' || process.env.OPERATOR_SMS_REQUIRED === '1';
}
