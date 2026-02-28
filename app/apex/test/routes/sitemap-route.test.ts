import { requestFromApp } from '../utils/request';

describe('GET /sitemap.xml', () => {
  it('returns XML with correct content type', async () => {
    const response = await requestFromApp('/sitemap.xml');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
  });

  it('returns valid sitemap XML structure', async () => {
    const response = await requestFromApp('/sitemap.xml');
    const body = await response.text();

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(body).toContain('</urlset>');
  });

  it('includes umaxica.app URLs', async () => {
    const response = await requestFromApp('/sitemap.xml');
    const body = await response.text();

    expect(body).toContain('<loc>https://umaxica.app/</loc>');
    expect(body).toContain('<loc>https://umaxica.app/about</loc>');
    expect(body).toContain('<loc>https://umaxica.app/health</loc>');
  });

  it('applies security headers', async () => {
    const response = await requestFromApp('/sitemap.xml');

    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
