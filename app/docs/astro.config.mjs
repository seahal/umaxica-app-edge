// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// oxlint-disable-next-line import/default
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  output: 'server',
  integrations: [sentry()],
});
