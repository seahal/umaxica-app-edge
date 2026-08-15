import { Hono } from 'hono';
import { apexSecurityHeaders } from '../src/security-headers';

describe('apexSecurityHeaders', () => {
  it('sets the preserved CSP and all required security headers', async () => {
    const app = new Hono();
    app.use('*', apexSecurityHeaders);
    app.get('/', (c) => c.text('ok'));

    const res = await app.request('/');
    expect(res.headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(res.headers.get('strict-transport-security')).toContain('includeSubDomains');
    expect(res.headers.get('strict-transport-security')).toContain('preload');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    /*
     * `style-src` is 'self' alone. It used to carry a sha256 of an inline
     * <style> alongside 'self', which bought nothing — 'self' already
     * permitted a same-origin stylesheet — while forcing the digest to be
     * recomputed by hand on every CSS change. The stylesheet is a compiled
     * static asset now, so the narrower policy is the correct one.
     */
    expect(res.headers.get('content-security-policy')).toContain("style-src 'self';");
    expect(res.headers.get('content-security-policy')).not.toContain('sha256-');
    expect(res.headers.get('content-security-policy')).toContain("style-src-attr 'none'");
    expect(res.headers.get('content-security-policy')).toContain('upgrade-insecure-requests');
    expect(res.headers.get('permissions-policy')).toContain('accelerometer=()');
    expect(res.headers.get('permissions-policy')).toContain('camera=()');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
  });
});
