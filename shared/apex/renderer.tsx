/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, ViteClient } from 'vite-ssr-components/hono';

const renderViteClient = () => {
  try {
    return <ViteClient />;
  } catch (err) {
    console.error('Failed to render ViteClient', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return null;
  }
};

const renderStylesheet = () => {
  try {
    return <Link href="/src/style.css" rel="stylesheet" />;
  } catch (err) {
    console.error('Failed to render stylesheet link from Vite manifest', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return <link href="/src/style.css" rel="stylesheet" />;
  }
};

export const renderer = jsxRenderer(({ children }) => {
  const currentYear = new Date().getUTCFullYear();
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>UMAXICA</title>
        {renderViteClient()}
        {renderStylesheet()}
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
