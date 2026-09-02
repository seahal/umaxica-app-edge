// @ts-check
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';

/*
 * Astro pilot for the twelve content frames (plans/tanstack-start-agile-reddy.md,
 * Phase 1). Juxtaposed with the TanStack Start build in this unit, not replacing
 * it: this config owns its own `srcDir`, `publicDir` and `outDir` so `vite build`
 * and `astro build` never touch each other's files.
 *
 * Decisions carried over from the TanStack Start unit deliberately:
 *
 * - `output: 'static'`. Every HTML route is prerendered at build time. Only two
 *   routes opt out with `export const prerender = false`: `/health` (Rails
 *   liveness probe over the Workers VPC binding — machine endpoint, 200/503) and
 *   `/` (Accept-Language negotiation → 302 to /ja/ or /en/). Everything else is
 *   a file on Cloudflare's asset layer, served without invoking the Worker.
 *
 * - Security headers live in `public-astro/_headers`, matched by Cloudflare
 *   before the Worker runs. The CSP is the same policy the TanStack unit set
 *   per-request in `src/security-headers.ts`, minus the nonce: with
 *   `build.inlineStylesheets: 'never'` and no `is:inline` scripts, every script
 *   and style is a same-origin file, so `script-src 'self'` / `style-src 'self'`
 *   need no nonce and no hash. The two on-demand routes set their own headers.
 *
 * - Region (jp/us) is a build-time input, not a runtime one. `PUBLIC_REGION`
 *   selects the canonical origin, exactly as the TanStack unit hardcoded
 *   `CANONICAL_ORIGIN` per unit. One build per region; the ops choice of one
 *   Worker on two custom domains vs two deployments is deferred (plan §16).
 *
 * - Language (ja/en) is a URL path prefix. Both locales are prefixed and there
 *   is no default route — `/` negotiates. `<html lang>` always agrees with the
 *   routed locale (unlike the apex units; see adr/011).
 */
export default defineConfig({
  srcDir: './src-astro',
  publicDir: './public-astro',
  outDir: './dist/astro',
  // Content pages use the trailing-slash form everywhere it matters — canonical
  // tags, hreflang, nav links, sitemap, `start_url` — but the setting stays
  // `ignore` so the extension-less machine endpoints (`/health`, `/revision`)
  // are not forced through a 301 to a slashed spelling.
  trailingSlash: 'ignore',

  site:
    process.env.PUBLIC_REGION === 'us'
      ? 'https://news-us.umaxica.org'
      : 'https://news-jp.umaxica.org',

  output: 'static',
  adapter: cloudflare({
    configPath: './wrangler.astro.jsonc',
    platformProxy: { enabled: true, configPath: './wrangler.astro.jsonc' },
    // A Workers VPC Service has no local simulator, so any build that tries to
    // resolve the binding opens a remote proxy session that only an interactive
    // `wrangler login` can authenticate. Prerendering never touches a binding —
    // run it in Node — and the build must not reach for the real binding.
    // Mirrors adr/013 sub-decision 3 (`remoteBindings: false unless CLOUDFLARE_ENV=vpc`).
    remoteBindings: process.env.CLOUDFLARE_ENV === 'vpc',
    prerenderEnvironment: 'node',
    // No image optimisation layer — the TanStack unit had none.
    imageService: 'passthrough',
  }),

  // This unit holds no session state; the adapter's KV session binding is inert
  // but declaring it off keeps the generated wrangler config honest.
  session: false,

  i18n: {
    locales: ['ja', 'en'],
    defaultLocale: 'ja',
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },

  build: {
    // Force every stylesheet to an external same-origin file so the CSP can be
    // `style-src 'self'` with no `'unsafe-inline'` and no per-build hash.
    inlineStylesheets: 'never',
    assets: 'assets',
    format: 'directory',
  },

  env: {
    schema: {
      PUBLIC_REGION: envField.enum({
        context: 'client',
        access: 'public',
        values: ['jp', 'us'],
        default: 'jp',
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
