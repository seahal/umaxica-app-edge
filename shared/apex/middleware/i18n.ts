import { languageDetector } from 'hono/language';
import type { MiddlewareHandler } from 'hono';

export function i18nMiddleware(): MiddlewareHandler {
  return languageDetector({ supportedLanguages: ['en', 'ja'], fallbackLanguage: 'en' });
}
