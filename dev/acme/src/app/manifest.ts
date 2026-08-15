import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Umaxica Dev',
    short_name: 'Umaxica Dev',
    description: 'Fresh Next.js app for umaxica.dev',
    start_url: '/',
    display: 'standalone',
    /*
     * A Web App Manifest is JSON read by the operating system, so these two
     * cannot reference a theme token. They mirror this unit's own identity —
     * `--color-canvas` and `--color-canvas-top` in src/app/globals.css — not the
     * shell palette the other units share.
     */
    background_color: '#f5f1e8',
    theme_color: '#f8f5ee',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
