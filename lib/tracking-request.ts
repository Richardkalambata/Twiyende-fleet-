const MAX_TRACKING_BODY_BYTES = 1024;

export async function readTrackingRequest(request: Request) {
  const url = new URL(request.url);
  // Next's Node adapter can build request.url from its internal listening host.
  const host = request.headers.get('host') || url.host;
  if (request.headers.get('origin') !== `${url.protocol}//${host}`) {
    return { ok: false as const, error: 'Invalid request origin', status: 403 };
  }
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (mediaType !== 'application/json') {
    return { ok: false as const, error: 'Expected JSON', status: 415 };
  }
  if (Number(request.headers.get('content-length')) > MAX_TRACKING_BODY_BYTES) {
    return { ok: false as const, error: 'Request too large', status: 413 };
  }
  const reader = request.body?.getReader();
  if (!reader) return { ok: false as const, error: 'Bad request', status: 400 };

  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let body = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_TRACKING_BODY_BYTES) {
        await reader.cancel();
        return { ok: false as const, error: 'Request too large', status: 413 };
      }
      body += decoder.decode(value, { stream: true });
    }
    const input: unknown = JSON.parse(body + decoder.decode());
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      return { ok: true as const, body: input as Record<string, unknown> };
    }
  } catch {
    // A broken stream or malformed JSON is a client error.
  }
  return { ok: false as const, error: 'Bad request', status: 400 };
}
