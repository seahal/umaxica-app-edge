import { BRAND_TLD, buildBrandTitle, DEFAULT_BRAND_NAME } from './brand';
/** @jsxImportSource hono/jsx */
import type { AssetEnv } from './security-headers';

const ABOUT_DESCRIPTION =
  'umaxica.net is a UMAXICA platform domain. Services and content are available on dedicated subdomains';

const ABOUT_CANONICAL_URL = 'https://umaxica.net/about';
const ABOUT_ROBOTS = 'index,follow';

/*
 * `/` and `/about` are two pages, not one page and a redirect to it. `/` says
 * what this domain is for; `/about` says what it is not. They therefore carry
 * different canonical URLs — pointing both at one of them would ask search
 * engines to drop the other, which is the SEO shape a redirect used to have and
 * the reason this pair has to be kept distinct deliberately.
 */
const HOME_DESCRIPTION =
  'umaxica.net is the UMAXICA domain for network and communication infrastructure';

const HOME_CANONICAL_URL = 'https://umaxica.net/';
const HOME_ROBOTS = 'index,follow';

function buildApexTitle(_env: AssetEnv, pageName: string): string {
  return buildBrandTitle(pageName, { brandName: DEFAULT_BRAND_NAME, tld: BRAND_TLD });
}

/*
 * The root title is the bare brand — `UMAXICA (NET)`, with no page segment —
 * because the homepage is not a page "within" the site the way `/about` is.
 * `buildBrandTitle` produces exactly that when given no page name.
 */
export function getHomeMeta(_env: AssetEnv, _language?: string) {
  return {
    title: buildBrandTitle(undefined, { brandName: DEFAULT_BRAND_NAME, tld: BRAND_TLD }),
    description: HOME_DESCRIPTION,
    canonical: HOME_CANONICAL_URL,
    robots: HOME_ROBOTS,
  };
}

export function renderHomeContent(language: string | undefined) {
  if (language === 'ja') {
    return (
      <div class="space-y-4">
        <h1 class="text-3xl leading-heading font-semibold">umaxica.net</h1>
        <p>本ドメインは、UMAXICA のネットワークおよび通信領域を担うドメインでございます。</p>
        <p>
          サービスをご利用の際は、各サービスの公式ウェブサイトへごアクセス賜りますようお願い申し上げます。
        </p>
        <ul class="space-y-1">
          <li>
            <a class="text-brand underline" href="https://umaxica.app">
              umaxica.app
            </a>
          </li>
          <li>
            <a class="text-brand underline" href="https://umaxica.com">
              umaxica.com
            </a>
          </li>
          <li>
            <a class="text-brand underline" href="https://umaxica.org">
              umaxica.org
            </a>
          </li>
          <li>
            <a class="text-brand underline" href="https://umaxica.dev">
              umaxica.dev
            </a>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <h1 class="text-3xl leading-heading font-semibold">umaxica.net</h1>
      <p>This domain carries the network and communication side of UMAXICA.</p>
      <p>To use our services, please visit the official website for the service you want.</p>
      <ul class="space-y-1">
        <li>
          <a class="text-brand underline" href="https://umaxica.app">
            umaxica.app
          </a>
        </li>
        <li>
          <a class="text-brand underline" href="https://umaxica.com">
            umaxica.com
          </a>
        </li>
        <li>
          <a class="text-brand underline" href="https://umaxica.org">
            umaxica.org
          </a>
        </li>
        <li>
          <a class="text-brand underline" href="https://umaxica.dev">
            umaxica.dev
          </a>
        </li>
      </ul>
    </div>
  );
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
          <a class="text-brand underline" href="https://umaxica.net">
            umaxica.net
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
        <a class="text-brand underline" href="https://umaxica.net">
          umaxica.net
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
