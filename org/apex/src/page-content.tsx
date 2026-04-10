import { createPageContent } from '../../../shared/apex/page-content';
import type { AssetEnv } from '../../../shared/apex/security-headers';
import { buildApexTitle as buildSiteTitle } from './site';

function buildApexTitle(_env: AssetEnv, _domain: string, pageName?: string) {
  return buildSiteTitle(pageName);
}

function renderAboutContent(language: string | undefined) {
  if (language === 'ja') {
    return (
      <div class="space-y-4">
        <h2 class="text-3xl font-semibold text-gray-800">このサイトについて</h2>
        <p>
          本ドメイン（<a href="https://umaxica.org">umaxica.org</a>
          ）は、一般向けのウェブサイトとして運用いたしております。
        </p>
        <p>
          他のドメインもご訪問ください: <a href="https://umaxica.app">umaxica.app</a>、{' '}
          <a href="https://umaxica.com">umaxica.com</a>。
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
      <p>
        This domain (<a href="https://umaxica.org">umaxica.org</a>) is not operated as a
        public-facing website.
      </p>
      <p>
        You may also visit our other domains: <a href="https://umaxica.app">umaxica.app</a>,{' '}
        <a href="https://umaxica.com">umaxica.com</a>.
      </p>
    </div>
  );
}

const pageContent = createPageContent({
  domain: 'org',
  tld: 'umaxica.org',
  aboutDescription:
    'umaxica.org is the apex domain of the UMAXICA platform. Services and content are available on dedicated subdomains',
  aboutCanonicalUrl: 'https://umaxica.org/about',
  aboutRobots: 'index,follow',
  renderAboutContent,
});

const { ABOUT_CANONICAL_URL, ABOUT_ROBOTS, getAboutMeta } = pageContent;

export { buildApexTitle, ABOUT_CANONICAL_URL, ABOUT_ROBOTS, getAboutMeta, renderAboutContent };
export type { AssetEnv };
