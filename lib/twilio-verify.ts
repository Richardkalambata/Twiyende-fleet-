export async function verifyRequest(service: string | undefined, endpoint: 'Verifications' | 'VerificationCheck', body: Record<string, string>) {
  const { TWILIO_API_KEY: key, TWILIO_API_SECRET: secret } = process.env;
  if (!service || !key || !secret) return null;
  try {
    const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(service)}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    return response.ok ? await response.json() as { sid: string; status: string } : null;
  } catch {
    return null;
  }
}
