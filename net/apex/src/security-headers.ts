import { secureHeaders } from 'hono/secure-headers';
import type { RateLimiter } from './rate-limit';
import { APEX_INLINE_STYLE_CSP_SOURCE } from './inline-style';

export const apexSecurityHeaders = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    fontSrc: ["'self'", 'data:'],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'", APEX_INLINE_STYLE_CSP_SOURCE],
    styleSrcAttr: ["'none'"],
    upgradeInsecureRequests: [],
  },
  permissionsPolicy: {
    accelerometer: [],
    camera: [],
    geolocation: [],
    gyroscope: [],
    magnetometer: [],
    microphone: [],
    payment: [],
    usb: [],
  },
  referrerPolicy: 'no-referrer',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xContentTypeOptions: 'nosniff',
  xFrameOptions: 'DENY',
});

export type AssetEnv = {
  BRAND_NAME?: string;
  CLOUDFLARE_ENV?: string;
  CF_VERSION_METADATA?: {
    id?: string;
    tag?: string;
    timestamp?: string;
  };
  RATE_LIMITER?: RateLimiter;
};
