import type { AssetEnv } from './security-headers';
import { BRAND_TLD, buildBrandTitle, DEFAULT_BRAND_NAME } from './brand';

const ABOUT_DESCRIPTION =
  'umaxica.net is a UMAXICA platform domain. Services and content are available on dedicated subdomains';

const ABOUT_CANONICAL_URL = 'https://umaxica.net/about';
const ABOUT_ROBOTS = 'index,follow';

function buildApexTitle(_env: AssetEnv, pageName: string): string {
  return buildBrandTitle(pageName, { brandName: DEFAULT_BRAND_NAME, tld: BRAND_TLD });
}

export function getAboutMeta(env: AssetEnv, language?: string) {
  return {
    title: buildApexTitle(env, language === 'ja' ? 'このサイトについて' : 'About'),
    description: ABOUT_DESCRIPTION,
    canonical: ABOUT_CANONICAL_URL,
    robots: ABOUT_ROBOTS,
  };
}

export function renderAboutContent(language: string | undefined) {
  if (language === 'ja') {
    return (
      <div class="space-y-4">
        <h2 class="text-3xl font-semibold text-gray-800">このサイトについて</h2>
        <p>
          本ドメイン（<a href="https://umaxica.net">umaxica.net</a>
          ）は、一般向けのウェブサイトとして運用いたしておりません。弊社サービスの利用につきましては、
          <a href="https://umaxica.app">umaxica.app</a>、{' '}
          <a href="https://umaxica.com">umaxica.com</a>、{' '}
          <a href="https://umaxica.org">umaxica.org</a>
          の公式ウェブサイトへごアクセス賜りますようお願い申し上げます。
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
      <p>
        This domain (<a href="https://umaxica.net">umaxica.net</a>) is not operated as a
        public-facing website. To access our services, please visit our official websites (
        <a href="https://umaxica.app">umaxica.app</a>, <a href="https://umaxica.com">umaxica.com</a>
        , <a href="https://umaxica.org">umaxica.org</a>).
      </p>
    </div>
  );
}
