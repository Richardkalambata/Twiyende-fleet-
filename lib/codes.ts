import { CODE_ALPHABET } from './constants';

export function randomCode(length = 4): string {
  const chars = CODE_ALPHABET;
  const limit = chars.length * Math.floor(256 / chars.length);
  let out = '';
  while (out.length < length) {
    const byte = crypto.getRandomValues(new Uint8Array(1))[0] ?? 0;
    if (byte < limit) out += chars[byte % chars.length];
  }
  return out;
}

export function codeFromIndex(index: number, length = 4): string {
  const chars = CODE_ALPHABET;
  let n = index;
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out = chars[n % chars.length] + out;
    n = Math.floor(n / chars.length);
  }
  return out;
}

export function normalizeFleetNumber(input: string): string {
  return input.trim().replace(/^bus\s*/i, '').replace(/\s+/g, '');
}

export function confusingCodeMessage(code: string): string | null {
  if (/[0O1IL]/i.test(code)) {
    return 'Twende codes skip 0, O, 1 and I so they are easy to read. Check the screen again.';
  }
  if (!/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(code)) {
    return 'Enter all 4 characters from the passenger’s screen.';
  }
  return null;
}
