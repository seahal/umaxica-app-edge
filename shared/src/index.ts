import type { Context, MiddlewareHandler } from "hono";

export type SecurityHeadersOptions = {
  cspStyleSrc?: string;
};

const DEFAULT_CSP_STYLE_SRC = "'self' https:";
const CSP_STYLE_UNSAFE_INLINE = "'self' https: 'unsafe-inline'";

export function buildCspHeader(styleSrc: string = DEFAULT_CSP_STYLE_SRC): string {
  return `default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src ${styleSrc}; style-src-attr 'none'; upgrade-insecure-requests`;
}

export function securityHeadersMiddleware(
  _options: SecurityHeadersOptions = {},
): MiddlewareHandler {
  return async (_c: Context, next) => {
    await next();
  };
}

export function applySecurityHeaders(c: Context): void {
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  c.header("Content-Security-Policy", buildCspHeader());
  c.header(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  );
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-XSS-Protection", "1; mode=block");
}

export function applySecurityHeadersUnsafeInline(c: Context): void {
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  c.header("Content-Security-Policy", buildCspHeader(CSP_STYLE_UNSAFE_INLINE));
  c.header(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  );
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-XSS-Protection", "1; mode=block");
}
