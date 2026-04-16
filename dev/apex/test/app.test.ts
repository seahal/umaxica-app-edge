import { describe, it, expect, vi } from 'vite-plus/test';
import { handleRequest } from '../src/app';

const BASE = 'http://localhost';

describe('dev/apex/src/app.ts', () => {
  describe('buildApexTitle', () => {
    it('returns base title without pageName', async () => {
      const res = handleRequest(new Request(`${BASE}/health`));
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('<title>UMAXICA (dev) - Apex</title>');
    });

    it('returns title with pageName when /about is requested', async () => {
      const res = handleRequest(new Request(`${BASE}/about`));
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('<title>About | UMAXICA (dev) - Apex</title>');
    });
  });

  describe('detectLanguage', () => {
    it('detects Japanese from query parameter', async () => {
      const res = handleRequest(new Request(`${BASE}/about?lang=ja`));
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('このサイトについて');
    });

    it('detects Japanese from accept-language header', async () => {
      const res = handleRequest(
        new Request(`${BASE}/about`, {
          headers: { 'accept-language': 'ja-JP,en-US;q=0.9' },
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('このサイトについて');
    });

    it('defaults to English for unknown language', async () => {
      const res = handleRequest(
        new Request(`${BASE}/about`, {
          headers: { 'accept-language': 'fr-FR;q=0.9' },
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('About this site');
    });
  });

  describe('buildPageShell', () => {
    it('renders Japanese content', async () => {
      const res = handleRequest(new Request(`${BASE}/about?lang=ja`));
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('html lang="ja"');
      expect(body).toContain('本ドメイン');
    });

    it('renders English content', async () => {
      const res = handleRequest(new Request(`${BASE}/about`));
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('html lang="en"');
      expect(body).toContain('public-facing');
    });
  });

  describe('buildHealthPageHtml', () => {
    it('renders health page with brand name and timestamp', async () => {
      const res = handleRequest(new Request(`${BASE}/health`));
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('UMAXICA');
      expect(body).toContain('<strong>Status:</strong> OK');
      expect(body).toContain('Timestamp:');
      expect(body).toContain('umaxica.dev');
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('GET /', () => {
    it('redirects to DEV_CORE_URL with 301', async () => {
      const res = handleRequest(new Request(`${BASE}/`));
      expect(res.status).toBe(301);
      expect(res.headers.get('location')).toBe('https://umaxica.dev/');
    });

    it('redirects to default DEV_CORE_URL', async () => {
      const res = handleRequest(new Request(`${BASE}/`));
      expect(res.status).toBe(301);
      expect(res.headers.get('location')).toBe('https://umaxica.dev/');
    });

    it('redirects to custom DEV_CORE_URL when set', async () => {
      vi.stubEnv('DEV_CORE_URL', 'https://custom.example.com/');
      const res = handleRequest(new Request(`${BASE}/`));
      expect(res.status).toBe(301);
      expect(res.headers.get('location')).toBe('https://custom.example.com/');
    });
  });

  describe('GET /about', () => {
    it('includes copyright year', async () => {
      const res = handleRequest(new Request(`${BASE}/about`));
      expect(res.status).toBe(200);
      const body = await res.text();
      const year = new Date().getUTCFullYear();
      expect(body).toContain(`&copy; ${year}`);
    });

    it('includes links to other domains', async () => {
      const res = handleRequest(new Request(`${BASE}/about`));
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('umaxica.app');
      expect(body).toContain('umaxica.com');
      expect(body).toContain('umaxica.org');
    });
  });

  describe('non-GET/HEAD methods', () => {
    it('returns 405 Method Not Allowed for POST', async () => {
      const res = handleRequest(new Request(`${BASE}/about`, { method: 'POST' }));
      expect(res.status).toBe(405);
      expect(res.headers.get('allow')).toBe('GET, HEAD');
    });

    it('returns 405 Method Not Allowed for PUT', async () => {
      const res = handleRequest(new Request(`${BASE}/health`, { method: 'PUT' }));
      expect(res.status).toBe(405);
      expect(res.headers.get('allow')).toBe('GET, HEAD');
    });

    it('returns 405 Method Not Allowed for DELETE', async () => {
      const res = handleRequest(new Request(`${BASE}/`, { method: 'DELETE' }));
      expect(res.status).toBe(405);
    });
  });

  describe('404 Not Found', () => {
    it('returns 404 for unknown routes', async () => {
      const res = handleRequest(new Request(`${BASE}/unknown`));
      expect(res.status).toBe(404);
      const body = await res.text();
      expect(body).toBe('Not Found');
    });

    it('returns 404 for /nonexistent', async () => {
      const res = handleRequest(new Request(`${BASE}/nonexistent`));
      expect(res.status).toBe(404);
    });
  });
});
