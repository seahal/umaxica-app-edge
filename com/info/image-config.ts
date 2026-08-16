import type { NextConfig } from 'next';

/**
 * `images` config for Cloudflare-deployed apps using OpenNext's native
 * IMAGES binding (no custom loader). remotePatterns is intentionally empty:
 * only repository-local static-import images are optimized today.
 *
 * Typed against `next`'s own `NextConfig['images']` rather than asserted into
 * shape at the `next.config.ts` call site: every unit declares `next` as a
 * direct dependency, so the type resolves here, and a drift in this object is
 * now a type error where it is written instead of a cast that hides it.
 */
export const imageConfig: NonNullable<NextConfig['images']> = {
  formats: ['image/avif', 'image/webp'],
  qualities: [75],
  remotePatterns: [],
  dangerouslyAllowSVG: false,
  contentDispositionType: 'attachment',
};
