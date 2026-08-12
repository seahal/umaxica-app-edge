import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UMAXICA Info (org)',
    short_name: 'UMAXICA Info',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#171717',
    icons: [{ src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }],
  };
}
