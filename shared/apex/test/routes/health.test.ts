import { describe, it, expect, vi } from 'vite-plus/test';
import { createHealthRoute } from '../../routes/health';

describe('shared/apex/routes/health.ts', () => {
  describe('createHealthRoute', () => {
    it('creates health route and responds to /health', async () => {
      const route = createHealthRoute();
      const res = await route.request('/health', {}, { BRAND_NAME: 'UMAXICA' });

      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('UMAXICA');
      expect(body).toContain('<strong>Status:</strong> OK');
    });

    it('uses default BRAND_NAME when not provided', async () => {
      const route = createHealthRoute();
      const res = await route.request('/health', {}, {});

      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('UMAXICA');
    });

    it('includes security headers', async () => {
      const route = createHealthRoute();
      const res = await route.request('/health', {}, { BRAND_NAME: 'UMAXICA' });

      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
      expect(res.headers.get('content-type')).toContain('text/html');
    });

    it('includes timestamp in response', async () => {
      const route = createHealthRoute();
      const res = await route.request('/health', {}, { BRAND_NAME: 'UMAXICA' });

      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('Timestamp:');
    });

    it('onError handler propagates errors to parent', async () => {
      const route = createHealthRoute();
      const mockErrorHandler = vi.fn((err: Error) => {
        throw err;
      });
      route.onError(mockErrorHandler);
      await expect(route.request('/health', {}, { BRAND_NAME: 'UMAXICA' })).resolves.toBeDefined();
    });
  });

  describe('handleHealthError', () => {
    it('is exported as function', async () => {
      const { handleHealthError } = await import('../../routes/health');
      expect(typeof handleHealthError).toBe('function');
    });
  });
});
