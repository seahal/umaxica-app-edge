import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import appDocsRobots from '../app/docs/src/app/robots';
import appDocsSitemap from '../app/docs/src/app/sitemap';
import appDocsManifest from '../app/docs/src/app/manifest';
import { GET as appDocsHealth } from '../app/docs/src/app/health/route';
import appHelpRobots from '../app/help/src/app/robots';
import appHelpSitemap from '../app/help/src/app/sitemap';
import appHelpManifest from '../app/help/src/app/manifest';
import { GET as appHelpHealth } from '../app/help/src/app/health/route';
import appInfoRobots from '../app/info/src/app/robots';
import appInfoSitemap from '../app/info/src/app/sitemap';
import appInfoManifest from '../app/info/src/app/manifest';
import { GET as appInfoHealth } from '../app/info/src/app/health/route';
import appNewsRobots from '../app/news/src/app/robots';
import appNewsSitemap from '../app/news/src/app/sitemap';
import appNewsManifest from '../app/news/src/app/manifest';
import { GET as appNewsHealth } from '../app/news/src/app/health/route';
import comDocsRobots from '../com/docs/src/app/robots';
import comDocsSitemap from '../com/docs/src/app/sitemap';
import comDocsManifest from '../com/docs/src/app/manifest';
import { GET as comDocsHealth } from '../com/docs/src/app/health/route';
import comHelpRobots from '../com/help/src/app/robots';
import comHelpSitemap from '../com/help/src/app/sitemap';
import comHelpManifest from '../com/help/src/app/manifest';
import { GET as comHelpHealth } from '../com/help/src/app/health/route';
import comInfoRobots from '../com/info/src/app/robots';
import comInfoSitemap from '../com/info/src/app/sitemap';
import comInfoManifest from '../com/info/src/app/manifest';
import { GET as comInfoHealth } from '../com/info/src/app/health/route';
import comNewsRobots from '../com/news/src/app/robots';
import comNewsSitemap from '../com/news/src/app/sitemap';
import comNewsManifest from '../com/news/src/app/manifest';
import { GET as comNewsHealth } from '../com/news/src/app/health/route';
import orgDocsRobots from '../org/docs/src/app/robots';
import orgDocsSitemap from '../org/docs/src/app/sitemap';
import orgDocsManifest from '../org/docs/src/app/manifest';
import { GET as orgDocsHealth } from '../org/docs/src/app/health/route';
import orgHelpRobots from '../org/help/src/app/robots';
import orgHelpSitemap from '../org/help/src/app/sitemap';
import orgHelpManifest from '../org/help/src/app/manifest';
import { GET as orgHelpHealth } from '../org/help/src/app/health/route';
import orgInfoRobots from '../org/info/src/app/robots';
import orgInfoSitemap from '../org/info/src/app/sitemap';
import orgInfoManifest from '../org/info/src/app/manifest';
import { GET as orgInfoHealth } from '../org/info/src/app/health/route';
import orgNewsRobots from '../org/news/src/app/robots';
import orgNewsSitemap from '../org/news/src/app/sitemap';
import orgNewsManifest from '../org/news/src/app/manifest';
import { GET as orgNewsHealth } from '../org/news/src/app/health/route';

const nextApps = [
  [
    'app/docs',
    'docs-jp.umaxica.app',
    appDocsRobots,
    appDocsSitemap,
    appDocsManifest,
    appDocsHealth,
  ],
  [
    'app/help',
    'help-jp.umaxica.app',
    appHelpRobots,
    appHelpSitemap,
    appHelpManifest,
    appHelpHealth,
  ],
  [
    'app/info',
    'info-jp.umaxica.app',
    appInfoRobots,
    appInfoSitemap,
    appInfoManifest,
    appInfoHealth,
  ],
  [
    'app/news',
    'news-jp.umaxica.app',
    appNewsRobots,
    appNewsSitemap,
    appNewsManifest,
    appNewsHealth,
  ],
  [
    'com/docs',
    'docs-jp.umaxica.com',
    comDocsRobots,
    comDocsSitemap,
    comDocsManifest,
    comDocsHealth,
  ],
  [
    'com/help',
    'help-jp.umaxica.com',
    comHelpRobots,
    comHelpSitemap,
    comHelpManifest,
    comHelpHealth,
  ],
  [
    'com/info',
    'info-jp.umaxica.com',
    comInfoRobots,
    comInfoSitemap,
    comInfoManifest,
    comInfoHealth,
  ],
  [
    'com/news',
    'news-jp.umaxica.com',
    comNewsRobots,
    comNewsSitemap,
    comNewsManifest,
    comNewsHealth,
  ],
  [
    'org/docs',
    'docs-jp.umaxica.org',
    orgDocsRobots,
    orgDocsSitemap,
    orgDocsManifest,
    orgDocsHealth,
  ],
  [
    'org/help',
    'help-jp.umaxica.org',
    orgHelpRobots,
    orgHelpSitemap,
    orgHelpManifest,
    orgHelpHealth,
  ],
  [
    'org/info',
    'info-jp.umaxica.org',
    orgInfoRobots,
    orgInfoSitemap,
    orgInfoManifest,
    orgInfoHealth,
  ],
  [
    'org/news',
    'news-jp.umaxica.org',
    orgNewsRobots,
    orgNewsSitemap,
    orgNewsManifest,
    orgNewsHealth,
  ],
] as const;

const allWorkers = [
  'app/apex',
  'com/apex',
  'net/apex',
  'org/apex',
  'app/core',
  'app/docs',
  'app/help',
  'app/info',
  'app/news',
  'com/core',
  'com/docs',
  'com/help',
  'com/info',
  'com/news',
  'org/core',
  'org/docs',
  'org/help',
  'org/info',
  'org/news',
] as const;

describe.each(nextApps)(
  '%s standard metadata',
  (workspace, host, robots, sitemap, manifest, health) => {
    it('keeps robots and sitemap on the canonical host', () => {
      expect(robots()).toMatchObject({
        rules: { userAgent: '*', allow: '/' },
        sitemap: `https://${host}/sitemap.xml`,
      });
      expect(sitemap()).toEqual([expect.objectContaining({ url: `https://${host}/` })]);
    });

    it('publishes the minimal manifest and lightweight health response', async () => {
      expect(manifest()).toMatchObject({
        start_url: '/',
        display: 'standalone',
        icons: [expect.objectContaining({ src: '/favicon.ico' })],
      });
      const response = health();
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toContain('no-store');
      await expect(response.json()).resolves.toEqual({ status: 'ok' });
    });

    it('contains the required browser assets', () => {
      expect(statSync(resolve(workspace, 'src/app/favicon.ico')).size).toBeGreaterThan(0);
      const worker = readFileSync(resolve(workspace, 'public/service-worker.js'), 'utf8');
      expect(worker).toContain("event.request.mode !== 'navigate'");
      expect(worker).toContain('fetch(event.request).catch');
      expect(worker).toContain('cache.add(OFFLINE_URL)');
    });
  },
);

describe.each(allWorkers)('%s service worker asset', (workspace) => {
  it('uses network failure only for the offline fallback', () => {
    const worker = readFileSync(resolve(workspace, 'public/service-worker.js'), 'utf8');
    expect(worker).toContain("const OFFLINE_URL = '/offline'");
    expect(worker).not.toContain('response.ok');
  });
});
