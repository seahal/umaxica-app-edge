import { describe, expect, it } from 'vite-plus/test';
import { Hono } from 'hono';
import { apexCsrfMiddleware, isAllowedApexOrigin } from './csrf';

describe('middleware/csrf', () => {
  describe('isAllowedApexOrigin', () => {
    it('returns false for undefined origin', () => {
      expect(isAllowedApexOrigin(undefined)).toBe(false);
    });

    it('returns false for empty string origin', () => {
      expect(isAllowedApexOrigin('')).toBe(false);
    });

    it('returns true for production origins', () => {
      expect(isAllowedApexOrigin('https://umaxica.com')).toBe(true);
      expect(isAllowedApexOrigin('https://umaxica.org')).toBe(true);
      expect(isAllowedApexOrigin('https://umaxica.app')).toBe(true);
      expect(isAllowedApexOrigin('https://umaxica.net')).toBe(true);
    });

    it('returns true for localhost origins with port', () => {
      expect(isAllowedApexOrigin('http://com.localhost:3333')).toBe(true);
      expect(isAllowedApexOrigin('http://org.localhost:5173')).toBe(true);
      expect(isAllowedApexOrigin('http://app.localhost:8787')).toBe(true);
      expect(isAllowedApexOrigin('http://net.localhost:3000')).toBe(true);
    });

    it('returns true for localhost origins without port', () => {
      expect(isAllowedApexOrigin('http://com.localhost')).toBe(true);
      expect(isAllowedApexOrigin('http://org.localhost')).toBe(true);
      expect(isAllowedApexOrigin('http://app.localhost')).toBe(true);
      expect(isAllowedApexOrigin('http://net.localhost')).toBe(true);
    });

    it('returns true for preview workers.dev origins', () => {
      expect(isAllowedApexOrigin('https://abc123.workers.dev')).toBe(true);
      expect(isAllowedApexOrigin('https://branch-name.workers.dev')).toBe(true);
      expect(isAllowedApexOrigin('https://com-apex.workers.dev')).toBe(true);
    });

    it('returns false for invalid origins', () => {
      expect(isAllowedApexOrigin('https://evil.com')).toBe(false);
      expect(isAllowedApexOrigin('https://attacker.example.com')).toBe(false);
      expect(isAllowedApexOrigin('javascript:alert(1)')).toBe(false);
    });

    it('returns false for http production origins', () => {
      expect(isAllowedApexOrigin('http://umaxica.com')).toBe(false);
      expect(isAllowedApexOrigin('http://umaxica.org')).toBe(false);
    });

    it('returns false for invalid localhost subdomains', () => {
      expect(isAllowedApexOrigin('http://www.localhost')).toBe(false);
      expect(isAllowedApexOrigin('http://test.localhost')).toBe(false);
    });
  });

  describe('apexCsrfMiddleware', () => {
    it('returns a middleware handler function', () => {
      const middleware = apexCsrfMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('rejects POST requests from disallowed origins', async () => {
      const app = new Hono();
      app.use('*', apexCsrfMiddleware());
      app.post('/test', (c) => c.text('ok'));

      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          origin: 'https://evil.com',
        },
        body: 'data=test',
      });

      expect(response.status).toBe(403);
    });

    it('rejects POST requests from cross-site (sec-fetch-site)', async () => {
      const app = new Hono();
      app.use('*', apexCsrfMiddleware());
      app.post('/test', (c) => c.text('ok'));

      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'sec-fetch-site': 'cross-site',
        },
        body: 'data=test',
      });

      expect(response.status).toBe(403);
    });

    it('allows GET requests without origin', async () => {
      const app = new Hono();
      app.use('*', apexCsrfMiddleware());
      app.get('/test', (c) => c.text('ok'));

      const response = await app.request('/test', { method: 'GET' });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('ok');
    });

    it('allows POST with allowed origin', async () => {
      const app = new Hono();
      app.use('*', apexCsrfMiddleware());
      app.post('/test', (c) => c.text('ok'));

      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://umaxica.com',
        },
        body: '{"test": true}',
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('ok');
    });
  });
});
