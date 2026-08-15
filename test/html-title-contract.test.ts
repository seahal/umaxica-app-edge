import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error React is provided by the app workspace, not the root package.
import { createElement } from '../app/core/node_modules/react';
import { renderToStaticMarkup } from '../app/core/node_modules/react-dom/server';
import { setCloudflareContext } from '@opennextjs/cloudflare';
import appApex from '../app/apex/src/index';
import comApex from '../com/apex/src/index';
import orgApex from '../org/apex/src/index';
import netApex from '../net/apex/src/index';
import { createApexApp as createAppApex } from '../app/apex/src/create-apex-app';
import { createApexApp as createComApex } from '../com/apex/src/create-apex-app';
import { createApexApp as createOrgApex } from '../org/apex/src/create-apex-app';
import { createApexApp as createNetApex } from '../net/apex/src/create-apex-app';
import { app as devApex } from '../dev/apex/src/app';

// Every workspace resolves `next/font/google` to the same physical package, so
// mocking that resolved path once covers all 16 root layouts. A bare
// `vi.mock('next/font/google')` would only be resolved relative to this file.
vi.mock('../app/core/node_modules/next/font/google', () => ({
  Inter: () => ({ variable: 'font-sans' }),
}));

// Root layouts are imported statically: they call next/font at module scope, and
// only a static import participates in the vi.mock registry above.
import * as appCoreLayout from '../app/core/src/app/layout';
import * as appDocsLayout from '../app/docs/src/app/layout';
import * as appHelpLayout from '../app/help/src/app/layout';
import * as appInfoLayout from '../app/info/src/app/layout';
import * as appNewsLayout from '../app/news/src/app/layout';
import * as comCoreLayout from '../com/core/src/app/layout';
import * as comDocsLayout from '../com/docs/src/app/layout';
import * as comHelpLayout from '../com/help/src/app/layout';
import * as comInfoLayout from '../com/info/src/app/layout';
import * as comNewsLayout from '../com/news/src/app/layout';
import * as orgCoreLayout from '../org/core/src/app/layout';
import * as orgDocsLayout from '../org/docs/src/app/layout';
import * as orgHelpLayout from '../org/help/src/app/layout';
import * as orgInfoLayout from '../org/info/src/app/layout';
import * as orgNewsLayout from '../org/news/src/app/layout';
import * as devAcmeLayout from '../dev/acme/src/app/layout';

type LayoutMetadata = { metadata: { title: { default: string; template: string } } };

const ROOT_LAYOUTS: Record<string, LayoutMetadata> = {
  'app/core': appCoreLayout as LayoutMetadata,
  'app/docs': appDocsLayout as LayoutMetadata,
  'app/help': appHelpLayout as LayoutMetadata,
  'app/info': appInfoLayout as LayoutMetadata,
  'app/news': appNewsLayout as LayoutMetadata,
  'com/core': comCoreLayout as LayoutMetadata,
  'com/docs': comDocsLayout as LayoutMetadata,
  'com/help': comHelpLayout as LayoutMetadata,
  'com/info': comInfoLayout as LayoutMetadata,
  'com/news': comNewsLayout as LayoutMetadata,
  'org/core': orgCoreLayout as LayoutMetadata,
  'org/docs': orgDocsLayout as LayoutMetadata,
  'org/help': orgHelpLayout as LayoutMetadata,
  'org/info': orgInfoLayout as LayoutMetadata,
  'org/news': orgNewsLayout as LayoutMetadata,
  'dev/acme': devAcmeLayout as LayoutMetadata,
};
vi.mock('@sentry/nextjs', () => ({ captureException: () => {} }));

/**
 * The single owner of the UMAXICA HTML `<title>` contract.
 *
 *   Root title -> `UMAXICA ({TLD})`
 *   Page title -> `{LOCALIZED_PAGE_TITLE} — UMAXICA ({TLD})`
 *
 * Two things this file deliberately does NOT do:
 *
 * - It does not grep sources for the string `title`. A page can export
 *   `metadata = {}` and pass any such search while shipping no title at all, so
 *   every page module here is imported and its resolved title inspected.
 * - It does not accept a value living inside a React component as proof. Where a
 *   document is assembled outside the Metadata API (Hono routes, `global-error`,
 *   the 429 responses) the acceptance check runs against the FINAL HTML.
 *
 * Each surface is verified through the mechanism that actually produces its
 * title — Next.js Metadata API, React 19 title hoisting, or a hand-written HTML
 * document — rather than through one artificially unified path.
 */

const repoRoot = join(import.meta.dirname, '..');

const FAMILY_TLD: Record<string, string> = {
  app: 'APP',
  com: 'COM',
  org: 'ORG',
  net: 'NET',
  dev: 'DEV',
};

/** Satellite deployment units whose root title carries the product name. */
const SATELLITE_ROLE: Record<string, string> = {
  docs: 'Docs',
  help: 'Help',
  info: 'Info',
  news: 'News',
};

const TITLE_CONTRACT = /^(?:.+ — )?UMAXICA \((APP|COM|ORG|NET|DEV)\)$/;

/**
 * Surface and runtime names. A user-facing title must never reveal which
 * deployment unit or which runtime served the route, so that Rails and Edge can
 * split routes inside one FQDN invisibly.
 */
const FORBIDDEN_TOKEN =
  /\b(?:auth|core|apex|side|edge|next|next\.js|nextjs|hono|workers?|cloudflare|opennext)\b/i;

function trackedFiles(): string[] {
  const injected = process.env.EDGE_TRACKED_FILES;
  if (injected !== undefined) {
    return injected.split('\n').filter(Boolean);
  }
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

function titlesIn(html: string): string[] {
  return [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)].map((match) => match[1] ?? '');
}

type TitleExpectation = {
  /** Deployment family the surface belongs to; its TLD must appear in the title. */
  tld: string;
  /** True when the surface is not an app root and therefore needs its own title. */
  requirePageSpecific?: boolean;
  label: string;
};

/** The shared acceptance set applied to every HTML document in the repository. */
function expectTitleContract(html: string, { tld, requirePageSpecific, label }: TitleExpectation) {
  const found = titlesIn(html);

  // 1 + 2. Exactly one <title> exists.
  expect(found, `${label}: expected exactly one <title> in the final HTML`).toHaveLength(1);

  const title = (found[0] ?? '').trim();

  // 3. Non-empty after trim.
  expect(title, `${label}: <title> is empty or whitespace-only`).not.toBe('');

  // 4. UMAXICA in exact uppercase.
  expect(title, `${label}: brand must be exactly "UMAXICA"`).toContain('UMAXICA');
  expect(title, `${label}: brand casing must not vary`).not.toMatch(/Umaxica|umaxica/);

  // 5 + 6. EM DASH contract, uppercase TLD matching the deployment family.
  expect(title, `${label}: does not match the UMAXICA title contract`).toMatch(TITLE_CONTRACT);
  expect(title, `${label}: TLD must match the deployment family`).toContain(`UMAXICA (${tld})`);

  // 7. No surface or runtime name.
  expect(title, `${label}: leaks a surface/runtime name`).not.toMatch(FORBIDDEN_TOKEN);

  // 8. Non-root surfaces carry a page-specific segment.
  if (requirePageSpecific) {
    expect(title, `${label}: expected a page-specific title, got the bare root title`).not.toBe(
      `UMAXICA (${tld})`,
    );
    expect(title, `${label}: page-specific title must precede the EM DASH`).toMatch(
      new RegExp(`^.+ — UMAXICA \\(${tld}\\)$`),
    );
  }
}

/** Every Next.js deployment unit, derived from tracked root layouts. */
function nextApps(): { workspace: string; family: string; role: string; tld: string }[] {
  return trackedFiles()
    .filter((file) => file.endsWith('/src/app/layout.tsx'))
    .map((file) => {
      const [family = '', role = ''] = file.split('/');
      return { workspace: `${family}/${role}`, family, role, tld: FAMILY_TLD[family] ?? '' };
    })
    .sort((a, b) => a.workspace.localeCompare(b.workspace));
}

function expectedRootTitle(role: string, tld: string): string {
  const product = SATELLITE_ROLE[role];
  return product ? `${product} — UMAXICA (${tld})` : `UMAXICA (${tld})`;
}

type ResolvedTitle = string | undefined;

/** Resolve what a Next.js module actually contributes as a title. */
async function resolveTitle(module: Record<string, unknown>): Promise<ResolvedTitle> {
  const generate = module.generateMetadata as undefined | (() => Promise<{ title?: unknown }>);
  const meta = generate ? await generate() : (module.metadata as { title?: unknown } | undefined);
  const title = meta?.title;

  if (typeof title === 'string') {
    return title;
  }
  if (title && typeof title === 'object') {
    const record = title as { absolute?: unknown; default?: unknown };
    if (typeof record.absolute === 'string') return record.absolute;
    if (typeof record.default === 'string') return record.default;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Guard B — root layout metadata (the source of every inherited title)
// ---------------------------------------------------------------------------

describe('root layout metadata', () => {
  const apps = nextApps();

  it('covers every Next.js deployment unit', () => {
    expect(apps.length).toBe(16);
  });

  it('has a statically imported layout for every unit', () => {
    expect(Object.keys(ROOT_LAYOUTS).sort()).toEqual(apps.map((app) => app.workspace).sort());
  });

  it.each(apps)('$workspace declares a contract-conforming title', ({ workspace, role, tld }) => {
    const title = ROOT_LAYOUTS[workspace]?.metadata.title;

    expect(title, `${workspace}: title must use default + template`).toBeTypeOf('object');
    expect(title?.default).toBe(expectedRootTitle(role, tld));
    expect(title?.template).toBe(`%s — UMAXICA (${tld})`);

    // The default is itself a rendered title and must satisfy the contract.
    expectTitleContract(`<title>${title?.default}</title>`, {
      tld,
      label: `${workspace} root title`,
    });
  });
});

// ---------------------------------------------------------------------------
// Guard A — missing-title regression: every page declares a title
// ---------------------------------------------------------------------------

describe('page title regression guard', () => {
  /**
   * A page is an app root when it is the deployment unit's index. Only these
   * may fall back to the root layout's `title.default`.
   */
  const isIndexPage = (file: string) =>
    file.endsWith('/src/app/page.tsx') || file.endsWith('/src/app/(page)/page.tsx');

  /**
   * Pages that render no HTML at all. `home/page.tsx` only calls `redirect()`,
   * and a redirect is explicitly outside the title contract.
   */
  const REDIRECT_ONLY = new Set(
    ['app', 'com', 'org'].map((family) => `${family}/core/src/app/(page)/home/page.tsx`),
  );

  const pages = trackedFiles().filter(
    (file) =>
      /\/src\/app\/.*page\.tsx$/.test(file) &&
      !REDIRECT_ONLY.has(file) &&
      existsSync(join(repoRoot, file)),
  );

  it('finds the expected number of HTML pages', () => {
    expect(pages.length).toBe(52);
  });

  const contentPages = pages.filter((file) => !isIndexPage(file));

  it.each(contentPages)('%s declares its own page-specific title', async (file) => {
    const module = (await import(/* @vite-ignore */ `../${file}`)) as Record<string, unknown>;

    expect(
      module.metadata !== undefined || module.generateMetadata !== undefined,
      `${file}: exports neither metadata nor generateMetadata — a new page must declare a title`,
    ).toBe(true);

    const title = await resolveTitle(module);
    const family = file.split('/')[0] ?? '';
    const tld = FAMILY_TLD[family] ?? '';

    // Rejects metadata = {}, title: '', title: '   ', and title: undefined.
    expect(typeof title, `${file}: resolved title is not a string`).toBe('string');
    expect((title ?? '').trim(), `${file}: resolved title is empty`).not.toBe('');

    // A page-specific title may not merely repeat the app root title.
    expect(title, `${file}: repeats the root title instead of naming the page`).not.toBe(
      `UMAXICA (${tld})`,
    );
    expect(title, `${file}: page title leaks a surface/runtime name`).not.toMatch(FORBIDDEN_TOKEN);
  });

  it.each(pages.filter(isIndexPage))('%s may inherit a contract-conforming root title', (file) => {
    const [family = '', role = ''] = file.split('/');
    const tld = FAMILY_TLD[family] ?? '';
    expectTitleContract(`<title>${expectedRootTitle(role, tld)}</title>`, {
      tld,
      label: `${file} inherited root title`,
    });
  });
});

// ---------------------------------------------------------------------------
// Guard A2 — the template actually composes end to end
// ---------------------------------------------------------------------------

describe('composed page titles', () => {
  const cases = [
    ['app/core', '(page)/configuration', '設定 — UMAXICA (APP)', 'APP'],
    ['com/core', '(page)/about', '概要 — UMAXICA (COM)', 'COM'],
    ['org/core', '(page)/configuration/account', 'アカウント設定 — UMAXICA (ORG)', 'ORG'],
    ['app/docs', 'offline', 'オフライン — UMAXICA (APP)', 'APP'],
  ] as const;

  it.each(cases)('%s/%s composes to the contract form', async (workspace, route, expected, tld) => {
    const page = (await import(
      /* @vite-ignore */ `../${workspace}/src/app/${route}/page.tsx`
    )) as Record<string, unknown>;

    const pageTitle = await resolveTitle(page);
    const template = ROOT_LAYOUTS[workspace]?.metadata.title.template ?? '';
    const composed = template.replace('%s', String(pageTitle));

    expect(composed).toBe(expected);
    expectTitleContract(`<title>${composed}</title>`, {
      tld,
      requirePageSpecific: true,
      label: `${workspace}/${route}`,
    });
  });
});

// ---------------------------------------------------------------------------
// Guard D1 — global-not-found: Next.js Metadata API
// ---------------------------------------------------------------------------

describe('global-not-found documents', () => {
  const files = trackedFiles().filter((file) => file.endsWith('/src/app/global-not-found.tsx'));

  it('exists for every Next.js unit that routes one', () => {
    expect(files.length).toBe(15);
  });

  it.each(files)('%s defines its title through the Metadata API', async (file) => {
    const module = (await import(/* @vite-ignore */ `../${file}`)) as Record<string, unknown>;
    const family = file.split('/')[0] ?? '';
    const tld = FAMILY_TLD[family] ?? '';

    // This document replaces the root layout, so no template can apply to it:
    // the title must be absolute and self-contained.
    const title = (module.metadata as { title?: { absolute?: string } })?.title;
    expect(title?.absolute, `${file}: expected an absolute title`).toBeTypeOf('string');

    expectTitleContract(`<title>${title?.absolute}</title>`, {
      tld,
      requirePageSpecific: true,
      label: file,
    });

    // It must still be a complete document.
    const html = renderToStaticMarkup(createElement(module.default as never));
    expect(html, `${file}: must render a full document`).toContain('<html');
  });
});

// ---------------------------------------------------------------------------
// Guard D2 — global-error: React 19 title hoisting (client component)
// ---------------------------------------------------------------------------

describe('global-error documents', () => {
  const files = trackedFiles().filter((file) => file.endsWith('/src/app/global-error.tsx'));

  it('exists for every Next.js unit', () => {
    expect(files.length).toBe(16);
  });

  it.each(files)('%s renders a non-empty <title> in its final HTML', async (file) => {
    const module = (await import(/* @vite-ignore */ `../${file}`)) as Record<string, unknown>;
    const family = file.split('/')[0] ?? '';

    // A client component cannot export metadata, so the title is asserted on the
    // rendered output rather than on any exported value.
    const html = renderToStaticMarkup(
      createElement(module.default as never, {
        error: Object.assign(new Error('boom'), { digest: 'test' }),
        reset: () => {},
      }),
    );

    expectTitleContract(html, {
      tld: FAMILY_TLD[family] ?? '',
      requirePageSpecific: true,
      label: file,
    });
  });
});

// ---------------------------------------------------------------------------
// Guard D3 — 429 responses: hand-written HTML documents
// ---------------------------------------------------------------------------

describe('rate limited 429 documents', () => {
  const blocked = { limit: async () => ({ success: false }) };

  const coreUnits = ['app', 'com', 'org'] as const;

  it.each(coreUnits)('%s/core serves a full 429 document', async (family) => {
    const { checkRateLimit } = (await import(
      /* @vite-ignore */ `../${family}/core/src/lib/rate-limit.ts`
    )) as { checkRateLimit: (request: Request, limiter: unknown) => Promise<Response | null> };

    const response = await checkRateLimit(new Request('https://example.test/'), blocked);
    expect(response?.status).toBe(429);
    expect(response?.headers.get('content-type')).toContain('text/html');

    expectTitleContract(await (response as Response).text(), {
      tld: FAMILY_TLD[family] ?? '',
      requirePageSpecific: true,
      label: `${family}/core 429`,
    });
  });

  const satellites = trackedFiles().filter(
    (file) => file.endsWith('/src/middleware.ts') && !file.includes('/core/'),
  );

  it('covers every satellite middleware', () => {
    expect(satellites.length).toBe(12);
  });

  it.each(satellites)('%s serves a full 429 document', async (file) => {
    setCloudflareContext({ env: { RATE_LIMITER: blocked } });
    const { middleware } = (await import(/* @vite-ignore */ `../${file}`)) as {
      middleware: (request: Request) => Promise<Response>;
    };

    const response = await middleware(new Request('https://example.test/'));
    expect(response.status).toBe(429);

    expectTitleContract(await response.text(), {
      tld: FAMILY_TLD[file.split('/')[0] ?? ''] ?? '',
      requirePageSpecific: true,
      label: file,
    });
  });
});

// ---------------------------------------------------------------------------
// Guard C — Hono workers, asserted on the real HTTP response
// ---------------------------------------------------------------------------

describe('Hono apex HTML routes', () => {
  const workers = [
    ['app', appApex, createAppApex],
    ['com', comApex, createComApex],
    ['org', orgApex, createOrgApex],
    ['net', netApex, createNetApex],
  ] as const;

  const env = { CF_VERSION_METADATA: {} };

  it.each(workers)(
    '%s apex serves contract-conforming HTML on every route',
    async (family, app) => {
      const tld = FAMILY_TLD[family] ?? '';

      for (const path of ['/about', '/health', '/health.html', '/offline']) {
        const response = await app.request(path, {}, env);
        expect(response.headers.get('content-type'), `${family} ${path}`).toContain('text/html');
        expectTitleContract(await response.text(), {
          tld,
          requirePageSpecific: true,
          label: `${family} apex ${path}`,
        });
      }

      const notFound = await app.request('/definitely-missing', {}, env);
      expect(notFound.status).toBe(404);
      expectTitleContract(await notFound.text(), {
        tld,
        requirePageSpecific: true,
        label: `${family} apex 404`,
      });
    },
  );

  it.each(workers)(
    '%s apex serves a contract-conforming 500 document',
    async (family, _app, factory) => {
      const app = factory(
        (pageRoutes) => {
          pageRoutes.get('/boom', () => {
            throw new Error('induced failure');
          });
        },
        { service: family },
      );

      const response = await app.request('/boom', {}, env);
      expect(response.status).toBe(500);
      expectTitleContract(await response.text(), {
        tld: FAMILY_TLD[family] ?? '',
        requirePageSpecific: true,
        label: `${family} apex 500`,
      });
    },
  );

  it.each(workers)('%s apex leaves non-HTML responses untouched', async (family, app) => {
    const healthJson = await app.request('/health.json', {}, env);
    expect(healthJson.headers.get('content-type')).toContain('application/json');
    const health = (await healthJson.json()) as Record<string, unknown>;
    expect(Object.keys(health).sort()).toEqual(
      ['edge', 'environment', 'service', 'status', 'time', 'version'].sort(),
    );
    expect(health).not.toHaveProperty('title');

    const revision = await app.request('/revision', {}, env);
    expect(revision.headers.get('content-type')).toContain('application/json');
    const body = (await revision.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['id', 'tag', 'timestamp']);
    expect(body).not.toHaveProperty('title');

    // The apex root is a redirect, not an HTML document.
    const root = await app.request('/', {}, env);
    expect([301, 302, 400]).toContain(root.status);
  });
});

// ---------------------------------------------------------------------------
// Guard C2 — dev/apex, including the error documents this repository now owns
// ---------------------------------------------------------------------------

describe('dev apex HTML routes', () => {
  it('serves contract-conforming HTML on every HTML route', async () => {
    for (const path of ['/about', '/health', '/health.html']) {
      const response = await devApex.request(path);
      expectTitleContract(await response.text(), {
        tld: 'DEV',
        requirePageSpecific: true,
        label: `dev apex ${path}`,
      });
    }
  });

  it('owns its 404 document rather than deferring to the platform default', async () => {
    const response = await devApex.request('/definitely-missing');
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('text/html');
    expectTitleContract(await response.text(), {
      tld: 'DEV',
      requirePageSpecific: true,
      label: 'dev apex 404',
    });
  });

  it('owns its 500 document rather than deferring to the platform default', async () => {
    // A fresh instance: Hono seals its router once the first request is matched,
    // so the throwing route has to be registered before this app serves anything.
    vi.resetModules();
    const { app } = (await import('../dev/apex/src/app')) as { app: typeof devApex };
    app.get('/__contract-boom', () => {
      throw new Error('induced failure');
    });

    const response = await app.request('/__contract-boom');
    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toContain('text/html');
    expectTitleContract(await response.text(), {
      tld: 'DEV',
      requirePageSpecific: true,
      label: 'dev apex 500',
    });
  });

  it('leaves non-HTML responses untouched', async () => {
    const healthJson = await devApex.request('/health.json');
    expect(healthJson.headers.get('content-type')).toContain('application/json');
    expect(await healthJson.json()).not.toHaveProperty('title');
  });
});
