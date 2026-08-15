/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer';
import { brandFromEnv, getBrandName } from './brand';
import { defaultLocale } from './i18n/config';
import { SeoHead } from './seo';
import { AppShell } from './shell';

/*
 * `/style.css` is Tailwind's output, compiled from `src/style.css` by the
 * `build:css` script and served by the assets binding — which Cloudflare
 * matches before the Worker runs, so the stylesheet costs no invocation and is
 * cached once for every document this unit serves.
 *
 * It replaced an inline `<style>` whose sha256 was hand-maintained in the CSP.
 * The hash bought nothing: `style-src` already listed `'self'`, which is what
 * permits this link, so the policy is now strictly `'self'` and one fewer
 * constant has to be kept in step with the stylesheet by hand.
 */
export const renderer = jsxRenderer(({ children }, c) => {
  const currentYear = new Date().getUTCFullYear();
  const brandName = getBrandName(c.env);
  const language = c.get('language');
  return (
    <html lang={defaultLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <SeoHead c={c} brand={brandFromEnv(c)} />
        <link rel="stylesheet" href="/style.css" />
        <script src="/service-worker-register.js" defer></script>
      </head>
      <body class="flex min-h-screen flex-col bg-gray-50 text-gray-900 leading-body">
        <AppShell brandName={brandName} year={currentYear} language={language}>
          {children}
        </AppShell>
      </body>
    </html>
  );
});
