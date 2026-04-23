const TITLE_BRAND_NAME = 'UMAXICA';
const DOMAIN = 'net';
const SITE_URL = 'umaxica.net';

export function buildApexTitle(pageName?: string): string {
  const baseTitle = `${TITLE_BRAND_NAME} (${DOMAIN}) - Apex`;
  return pageName ? `${pageName} | ${baseTitle}` : baseTitle;
}

export function buildHealthPageHtml(
  brandName: string,
  timestampIso: string,
  revision?: { id: string; tag: string; timestamp: string },
): string {
  const revisionHtml = revision
    ? `<p><strong>Revision ID:</strong> ${revision.id}</p>
      <p><strong>Revision Tag:</strong> ${revision.tag}</p>
      <p><strong>Revision Time:</strong> ${revision.timestamp}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${buildApexTitle()}</title>
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body style="font-family: system-ui, sans-serif; margin: 0; padding: 2rem; line-height: 1.6;">
    <main style="max-width: 720px; margin: 0 auto;">
      <h1 style="margin: 0 0 1rem;">${brandName}</h1>
      <p><strong>Status:</strong> OK</p>
      <p><strong>Timestamp:</strong> ${timestampIso}</p>
      <p><strong>Domain:</strong> ${SITE_URL}</p>
      ${revisionHtml}
    </main>
  </body>
</html>`;
}
