type AllowedRegion = 'jp' | 'us';

const DEFAULT_REGION: AllowedRegion = 'jp';

export function createRootRedirect(siteUrl: string) {
  const allowedUrls: Record<AllowedRegion, string> = {
    jp: `https://jp.${siteUrl}/`,
    us: `https://us.${siteUrl}/`,
  };

  const resolveRedirectUrl = (regionParam: string | null | undefined) => {
    const normalizedRegion = regionParam?.toLowerCase() ?? '';
    return allowedUrls[normalizedRegion as AllowedRegion] ?? null;
  };

  /* v8 ignore next */
  const getDefaultRedirectUrl = () => allowedUrls[DEFAULT_REGION] ?? null;

  const buildRegionErrorPayload = () => ({
    error: 'region_not_supported',
    message: 'Unable to determine a safe redirect target',
  });

  return { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload };
}
