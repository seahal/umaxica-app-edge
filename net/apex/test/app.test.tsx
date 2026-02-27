import app from '../src/index';

describe('Net Hono app', () => {
  it('renders health check', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('✓ OK');
    expect(body).toContain('Timestamp');
  });

  it('renders root page', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('About this site.');
    expect(body).toContain('umaxica.app');
  });

  it('renders about page', async () => {
    const res = await app.request('/about');
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('Contact');
  });

  it('applies security headers', async () => {
    const res = await app.request('/');
    expect(res.headers.get('Strict-Transport-Security')).toBeTruthy();
    expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });
});
