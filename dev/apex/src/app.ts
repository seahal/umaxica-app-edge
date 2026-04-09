import { Hono } from 'hono';

const app = new Hono();

// Health check - simple response, no Rails dependency
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dev-apex',
  });
});

// About page with language support
app.get('/about', (c) => {
  const language =
    c.req.query('lang') ?? c.req.header('accept-language')?.split(',')[0]?.split('-')[0];
  const isJapanese = language === 'ja';

  const html = `<!DOCTYPE html>
<html lang="${isJapanese ? 'ja' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isJapanese ? 'このサイトについて' : 'About this site'} - umaxica.dev</title>
  <meta name="description" content="${isJapanese ? 'umaxica.dev について' : 'About umaxica.dev'}">
</head>
<body style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6;">
  <h1>${isJapanese ? 'umaxica.dev について' : 'About umaxica.dev'}</h1>
  
  ${
    isJapanese
      ? `
  <p>本ドメイン（<strong>umaxica.dev</strong>）は、開発環境および開発者向けサービスとして運用されています。</p>
  <p>サービスの利用につきましては、<a href="https://umaxica.app">umaxica.app</a> をご覧ください。</p>
  `
      : `
  <p>This domain (<strong>umaxica.dev</strong>) is operated as a development environment and developer-focused service.</p>
  <p>For service usage, please visit <a href="https://umaxica.app">umaxica.app</a>.</p>
  `
  }
  
  <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #666; font-size: 0.9rem;">
    <p>&copy; ${new Date().getUTCFullYear()} UMAXICA</p>
  </footer>
</body>
</html>`;

  return c.html(html);
});

// Root redirect
app.get('/', (c) => {
  const redirectUrl = process.env.DEV_CORE_URL ?? 'https://umaxica.dev/';
  return c.redirect(redirectUrl, 301);
});

export { app };
