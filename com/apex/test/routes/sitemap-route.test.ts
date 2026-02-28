import { requestFromComApp } from '../utils/request';

describe('GET /sitemap.xml', () => {
  it('returns XML with correct content type', async () => {
    const response = await requestFromComApp('/sitemap.xml');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
  });

  it('returns valid sitemap XML structure', async () => {
    const response = await requestFromComApp('/sitemap.xml');
    const body = await response.text();

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(body).toContain('</urlset>');
  });

  it('includes umaxica.com URLs', async () => {
    const response = await requestFromComApp('/sitemap.xml');
    const body = await response.text();

    expect(body).toContain('<loc>https://umaxica.com/</loc>');
    expect(body).toContain('<loc>https://umaxica.com/about</loc>');
    expect(body).toContain('<loc>https://umaxica.com/health</loc>');
  });

  it('applies security headers', async () => {
    const response = await requestFromComApp('/sitemap.xml');

    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
