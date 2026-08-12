// Shared reading of `wrangler.jsonc` and `tools/workers-manifest.json`.
//
// Extracted from tools/check-workers.mjs so that tools/verify-edge-connectivity.mjs
// parses wrangler configuration the same way rather than grepping for strings.
// `wrangler.jsonc` carries comments and trailing commas, so `JSON.parse` alone
// rejects valid files.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Strip line and block comments plus trailing commas without touching string contents.
export function parseJsonc(text) {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const two = text.slice(i, i + 2);
    if (inString) {
      out += text[i];
      if (text[i] === '\\') {
        out += text[i + 1] ?? '';
        i++;
      } else if (text[i] === '"') {
        inString = false;
      }
    } else if (text[i] === '"') {
      inString = true;
      out += text[i];
    } else if (two === '//') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    } else if (two === '/*') {
      i += 2;
      while (i < text.length && text.slice(i, i + 2) !== '*/') i++;
      i++;
    } else {
      out += text[i];
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

export function loadManifest() {
  return JSON.parse(readFileSync(join(repoRoot, 'tools/workers-manifest.json'), 'utf8'));
}

/**
 * Read a workspace's `wrangler.jsonc`. Returns `{ config }` on success and
 * `{ error }` otherwise, so callers decide whether a missing file is fatal.
 */
export function readWranglerConfig(path) {
  const absolute = join(repoRoot, path);
  if (!existsSync(absolute)) {
    return { error: `${path} is missing` };
  }
  try {
    return { config: parseJsonc(readFileSync(absolute, 'utf8')) };
  } catch (error) {
    return { error: `${path} failed to parse: ${error.message}` };
  }
}

/** Every `vpc_services` entry, top level and in every environment. */
export function collectVpcBindings(config) {
  const collected = [...(config.vpc_services ?? [])];
  for (const env of Object.values(config.env ?? {})) {
    collected.push(...(env.vpc_services ?? []));
  }
  return collected;
}

const PLACEHOLDER_SERVICE_IDS = new Set([
  '',
  'todo',
  'tbd',
  'changeme',
  'replace-me',
  '00000000-0000-0000-0000-000000000000',
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reject an id that is absent, not a UUID, or an obvious stand-in. Returns null
 * when the id is usable, otherwise the reason it is not.
 */
export function describeServiceIdProblem(serviceId) {
  if (typeof serviceId !== 'string') {
    return 'service_id is missing';
  }
  const trimmed = serviceId.trim();
  if (PLACEHOLDER_SERVICE_IDS.has(trimmed.toLowerCase())) {
    return `service_id is a placeholder (${JSON.stringify(serviceId)})`;
  }
  if (/^x+$|^0+$/i.test(trimmed.replace(/-/g, ''))) {
    return `service_id is a placeholder (${JSON.stringify(serviceId)})`;
  }
  if (!UUID.test(trimmed)) {
    return `service_id is not a UUID (${JSON.stringify(serviceId)})`;
  }
  return null;
}
