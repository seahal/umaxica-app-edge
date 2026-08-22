export const DEFAULT_BRAND_NAME = 'UMAXICA';

/**
 * EM DASH. The UMAXICA title contract is `{PAGE} — UMAXICA ({TLD})`; the page
 * name leads and the brand closes. Do not substitute a hyphen or a pipe.
 */
export const DEFAULT_BRAND_SEPARATOR = ' — ';

/**
 * The TLD notation for this deployment unit, uppercase, matching the FQDN this
 * worker serves. Each frame owns its own copy of this module, so this constant
 * is a literal rather than a lookup.
 */
export const BRAND_TLD = 'NET';

type BrandEnv = {
  BRAND_NAME?: string;
};

export function getBrandName(env?: BrandEnv): string {
  return env?.BRAND_NAME || DEFAULT_BRAND_NAME;
}

export type BrandTitleOptions = {
  brandName: string;
  separator?: string;
  tld?: string;
  defaultPageTitle?: string;
};

type ContextWithEnv = {
  env?: Record<string, unknown>;
};

function toNonEmptyTrimmed(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveSeparator(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return value.trim().length > 0 ? value : undefined;
}

export function brandFromEnv(c: ContextWithEnv | null | undefined): BrandTitleOptions {
  const env = c?.env ?? {};
  const defaultPageTitle = toNonEmptyTrimmed(env.BRAND_DEFAULT_TITLE);

  // Cloudflare Workers vars:
  // - BRAND_NAME
  // - BRAND_SEPARATOR
  // - BRAND_DEFAULT_TITLE (optional)
  return {
    brandName: toNonEmptyTrimmed(env.BRAND_NAME) ?? DEFAULT_BRAND_NAME,
    separator: resolveSeparator(env.BRAND_SEPARATOR) ?? DEFAULT_BRAND_SEPARATOR,
    tld: toNonEmptyTrimmed(env.BRAND_TLD) ?? BRAND_TLD,
    ...(defaultPageTitle ? { defaultPageTitle } : {}),
  };
}

/**
 * Root title  -> `UMAXICA (TLD)`
 * Page title  -> `{PAGE} — UMAXICA (TLD)`
 *
 * Surface and runtime names (apex, core, edge, Hono, Workers, ...) must never
 * reach this function: the title a user sees may not reveal which runtime
 * served the route.
 */
export function buildBrandTitle(
  pageTitle: string | null | undefined,
  opt: BrandTitleOptions,
): string {
  const brandName = toNonEmptyTrimmed(opt.brandName) ?? DEFAULT_BRAND_NAME;
  const separator = resolveSeparator(opt.separator) ?? DEFAULT_BRAND_SEPARATOR;
  const tld = toNonEmptyTrimmed(opt.tld) ?? BRAND_TLD;
  const page = toNonEmptyTrimmed(pageTitle) ?? toNonEmptyTrimmed(opt.defaultPageTitle);
  const root = `${brandName} (${tld})`;

  return page ? `${page}${separator}${root}` : root;
}
