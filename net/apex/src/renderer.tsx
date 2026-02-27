import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, ViteClient } from 'vite-ssr-components/hono';

export const renderer = jsxRenderer((props: Record<string, unknown>) => {
  const { children, currentYear } = props;
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>UMAXICA</title>
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body class="min-h-screen flex flex-col bg-gray-50">
        <header class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 py-6">
            <h1 class="text-2xl font-bold text-gray-900">UMAXICA</h1>
          </div>
        </header>

        <main class="flex-grow max-w-7xl w-full mx-auto px-4 py-8">{children}</main>

        <footer class="bg-white border-t border-gray-200 mt-auto">
          <div class="max-w-7xl mx-auto px-4 py-4">
            <p class="text-center text-sm text-gray-600">&copy; {currentYear} UMAXICA</p>
          </div>
        </footer>
      </body>
    </html>
  );
});
