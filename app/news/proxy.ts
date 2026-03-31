import { type NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales } from './src/i18n/config';

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(',')
      .map((lang) => {
        const part = lang.split(';')?.[0]?.trim().split('-')?.[0];
        return part ?? '';
      })
      .find((lang) => locales.includes(lang as (typeof locales)[number]));
    if (preferred) return preferred;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/health' ||
    pathname.includes('.')
  ) {
    return;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!_next|api|health|favicon.ico|.*\\..*).*)'],
};
