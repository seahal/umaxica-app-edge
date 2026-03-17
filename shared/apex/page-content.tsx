import type { AssetEnv } from './security-headers';
import { DEFAULT_BRAND_NAME } from './brand';

export function buildApexTitle(_env: AssetEnv, domain: string, pageName?: string): string {
  const brandName = DEFAULT_BRAND_NAME;
  const baseTitle = `${brandName} (${domain}) - Apex`;
  return pageName ? `${pageName} | ${baseTitle}` : baseTitle;
}

type PageContentConfig = {
  domain: string;
  tld: string;
  aboutDescription: string;
  aboutCanonicalUrl: string;
  aboutRobots: string;
  renderAboutContent: (language: string | undefined) => unknown;
};

export function createPageContent(config: PageContentConfig) {
  const { domain, aboutDescription, aboutCanonicalUrl, aboutRobots, renderAboutContent } = config;

  function getAboutMeta(env: AssetEnv) {
    return {
      title: buildApexTitle(env, domain, 'About'),
      description: aboutDescription,
      canonical: aboutCanonicalUrl,
      robots: aboutRobots,
    };
  }

  return {
    ABOUT_CANONICAL_URL: aboutCanonicalUrl,
    ABOUT_ROBOTS: aboutRobots,
    buildApexTitle: (env: AssetEnv, pageName?: string) => buildApexTitle(env, domain, pageName),
    getAboutMeta,
    renderAboutContent,
  };
}
