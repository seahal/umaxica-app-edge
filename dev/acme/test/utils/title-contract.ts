import { expect } from 'vitest';

/**
 * The UMAXICA HTML `<title>` contract, as this deployment unit must honour it.
 *
 *   Root title -> `UMAXICA (DEV)`
 *   Page title -> `{LOCALIZED_PAGE_TITLE} — UMAXICA (DEV)`
 *
 * This unit owns its own copy so that the contract travels with the unit when
 * it is extracted into its own repository.
 */
export const TLD = 'DEV';

const TITLE_CONTRACT = /^(?:.+ — )?UMAXICA \((APP|COM|ORG|NET|DEV)\)$/;

/**
 * Surface and runtime names. A user-facing title must never reveal which
 * deployment unit or which runtime served the route, so that Rails and Edge can
 * split routes inside one FQDN invisibly.
 */
export const FORBIDDEN_TOKEN =
  /\b(?:auth|core|apex|side|edge|next|next\.js|nextjs|hono|workers?|cloudflare|opennext)\b/i;

export function titlesIn(html: string): string[] {
  return [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/g)].map((match) => match[1] ?? '');
}

type TitleExpectation = {
  /** True when the surface is not an app root and therefore needs its own title. */
  requirePageSpecific?: boolean;
  label: string;
};

/** The shared acceptance set applied to every HTML document in this unit. */
export function expectTitleContract(
  html: string,
  { requirePageSpecific, label }: TitleExpectation,
) {
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
  expect(title, `${label}: TLD must match the deployment family`).toContain(`UMAXICA (${TLD})`);

  // 7. No surface or runtime name.
  expect(title, `${label}: leaks a surface/runtime name`).not.toMatch(FORBIDDEN_TOKEN);

  // 8. Non-root surfaces carry a page-specific segment.
  if (requirePageSpecific) {
    expect(title, `${label}: expected a page-specific title, got the bare root title`).not.toBe(
      `UMAXICA (${TLD})`,
    );
    expect(title, `${label}: page-specific title must precede the EM DASH`).toMatch(
      new RegExp(`^.+ — UMAXICA \\(${TLD}\\)$`),
    );
  }
}

type ResolvedTitle = string | undefined;

/** Resolve what a Next.js module actually contributes as a title. */
export async function resolveTitle(module: Record<string, unknown>): Promise<ResolvedTitle> {
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
