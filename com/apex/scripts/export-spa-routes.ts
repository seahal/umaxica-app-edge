import { access, cp, mkdir, writeFile } from 'node:fs/promises';
import { buildSpaManifest } from '../../../shared/edge-static/spa-manifest.ts';
import { SPA_ROUTE_PATTERNS } from './spa-routes.ts';

async function copyDirIfExists(from: string, to: string): Promise<void> {
  try {
    await access(from);
  } catch {
    return;
  }

  await cp(from, to, { recursive: true, force: true });
}

const DIST_DIR = new URL('../dist/', import.meta.url);
const PUBLIC_DIR = new URL('../public/', import.meta.url);
const MANIFEST_FILE = new URL('../dist/spa-routes.json', import.meta.url);

await mkdir(DIST_DIR, { recursive: true });
await copyDirIfExists(PUBLIC_DIR.pathname, DIST_DIR.pathname);

const manifest = buildSpaManifest([...SPA_ROUTE_PATTERNS]);
await writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
