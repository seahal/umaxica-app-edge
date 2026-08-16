import { BRAND_TLD, buildBrandTitle, DEFAULT_BRAND_NAME } from './brand';
/** @jsxImportSource hono/jsx */
import type { AssetEnv } from './security-headers';

const ABOUT_DESCRIPTION =
  'umaxica.app is a UMAXICA platform domain. Services and content are available on dedicated subdomains';

const ABOUT_CANONICAL_URL = 'https://umaxica.app/about';
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
        <h1 class="text-3xl leading-heading font-semibold">このサイトについて</h1>
        <p>
          本ドメイン（
          <a class="text-brand underline" href="https://umaxica.app">
            umaxica.app
          </a>
          ）は、一般向けのウェブサイトとして運用いたしておりません。弊社サービスの利用につきましては、
          <a class="text-brand underline" href="https://umaxica.app">
            umaxica.app
          </a>
          、{' '}
          <a class="text-brand underline" href="https://umaxica.com">
            umaxica.com
          </a>
          、{' '}
          <a class="text-brand underline" href="https://umaxica.org">
            umaxica.org
          </a>
          の公式ウェブサイトへごアクセス賜りますようお願い申し上げます。
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <h1 class="text-3xl leading-heading font-semibold">About this site.</h1>
      <p>
        This domain (
        <a class="text-brand underline" href="https://umaxica.app">
          umaxica.app
        </a>
        ) is not operated as a public-facing website. To access our services, please visit our
        official websites (
        <a class="text-brand underline" href="https://umaxica.app">
          umaxica.app
        </a>
        ,{' '}
        <a class="text-brand underline" href="https://umaxica.com">
          umaxica.com
        </a>
        ,{' '}
        <a class="text-brand underline" href="https://umaxica.org">
          umaxica.org
        </a>
        ).
      </p>
    </div>
  );
}
