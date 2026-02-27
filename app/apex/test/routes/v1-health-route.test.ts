import { requestFromApp } from '../utils/request';

interface HealthResponse {
  status: string;
}

function assertIsHealthResponse(payload: unknown): asserts payload is HealthResponse {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('status' in payload) ||
    typeof (payload as { status?: unknown }).status !== 'string'
  ) {
    throw new Error('Invalid health response payload');
  }
}

describe('GET /v1/health', () => {
  it('returns JSON ok status', async () => {
    const response = await requestFromApp('/v1/health');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const payload = await response.json<HealthResponse>();

    expect(payload).toStrictEqual({ status: 'ok' });
  });

  it('attaches security headers to the JSON response', async () => {
    const response = await requestFromApp('/v1/health');

    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('includes all security headers for API endpoint', async () => {
    const response = await requestFromApp('/v1/health');

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('returns a valid JSON object with correct structure', async () => {
    const response = await requestFromApp('/v1/health');
    const payload: unknown = await response.json<unknown>();

    expectTypeOf(payload).toBeObject();
    expect(payload).not.toBeNull();
    assertIsHealthResponse(payload);
    expect(payload).toHaveProperty('status');
    expectTypeOf(payload.status).toBeString();
  });

  it('does not include extra fields in response', async () => {
    const response = await requestFromApp('/v1/health');
    const payload: unknown = await response.json<unknown>();
    assertIsHealthResponse(payload);

    const keys = Object.keys(payload);
    expect(keys).toStrictEqual(['status']);
  });
});
