import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://info-jp.umaxica.org/', changeFrequency: 'weekly', priority: 0.5 }];
}
