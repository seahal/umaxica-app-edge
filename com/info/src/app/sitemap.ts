import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://info-jp.umaxica.com/', changeFrequency: 'weekly', priority: 0.5 }];
}
