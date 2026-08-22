import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UMAXICA Help (app)',
    short_name: 'UMAXICA Help',
    start_url: '/',
    display: 'standalone',
    /*
     * A Web App Manifest is JSON read by the operating system, so these two
     * cannot reference a theme token — they are the one place a colour has to be
     * a literal. They are the converged palette all the same:
     * `background_color` is `bg-gray-50`, the body background this app paints,
     * and `theme_color` is `bg-white`, the header surface that sits under the
     * browser chrome. Re-derive them if the theme changes.
     */
    background_color: '#f9fafb',
    theme_color: '#ffffff',
    icons: [{ src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }],
  };
}
