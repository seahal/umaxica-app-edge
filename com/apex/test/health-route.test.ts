import { requestFromComApp } from './utils/request';

describe('GET /health', () => {
  it('returns the COM health HTML document', async () => {
    const response = await requestFromComApp('/health');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');

    const body = await response.text();
    expect(body).toContain('<title>Health Check - COM</title>');
    expect(body).toContain('<p>✓ OK</p>');
    expect(body).toContain('<strong>Timestamp:</strong>');
  });

  it('applies security headers to the health response', async () => {
    const response = await requestFromComApp('/health');

    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(response.headers.get('permissions-policy')).toContain('accelerometer=()');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });
});
