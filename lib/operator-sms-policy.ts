export function requiresOperatorSms(): boolean {
  return process.env.OPERATOR_SMS_REQUIRED === '1';
}
