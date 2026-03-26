import { describe, expect, it } from 'vite-plus/test';
import {
  rateLimitMiddleware,
  checkRateLimit,
  apexCsrfMiddleware,
  isAllowedApexOrigin,
  securityHeadersMiddleware,
  applySecurityHeaders,
  buildCspHeader,
  i18nMiddleware,
  etagMiddleware,
} from './index';

describe('middleware index exports', () => {
  it('exports rate-limit middleware', () => {
    expect(typeof rateLimitMiddleware).toBe('function');
    expect(typeof checkRateLimit).toBe('function');
  });

  it('exports CSRF middleware', () => {
    expect(typeof apexCsrfMiddleware).toBe('function');
    expect(typeof isAllowedApexOrigin).toBe('function');
  });

  it('exports security headers middleware', () => {
    expect(typeof securityHeadersMiddleware).toBe('function');
    expect(typeof applySecurityHeaders).toBe('function');
    expect(typeof buildCspHeader).toBe('function');
  });

  it('exports i18n middleware', () => {
    expect(typeof i18nMiddleware).toBe('function');
  });

  it('exports etag middleware', () => {
    expect(typeof etagMiddleware).toBe('function');
  });
});
