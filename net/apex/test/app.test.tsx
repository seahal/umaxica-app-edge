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

  it('renders footer with current UTC year', async () => {
    const res = await app.request('/');
    const body = await res.text();
    const currentYear = new Date().getUTCFullYear();
    expect(body).toContain(`© ${currentYear} UMAXICA`);
  });

  it('applies security headers', async () => {
    const res = await app.request('/');
    expect(res.headers.get('Strict-Transport-Security')).toBeTruthy();
    expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('returns sitemap.xml with correct content type', async () => {
    const res = await app.request('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
  });

  it('returns JSON health check at /v1/health', async () => {
    const res = await app.request('/v1/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });

  it('returns valid sitemap XML with umaxica.net URL', async () => {
    const res = await app.request('/sitemap.xml');
    const body = await res.text();
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<loc>https://umaxica.net/</loc>');
  });
});
