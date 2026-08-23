import { notFound } from '@tanstack/react-router';

import { defaultLocale, isLocale } from './config';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  ja: () => import('./dictionaries/ja.json').then((m) => m.default),
};

/**
 * `throw notFound()`, not `notFound()`.
 *
 * Next's `notFound()` threw internally, so calling it was enough and the line
 * below was unreachable for an unsupported locale. TanStack's RETURNS the
 * not-found signal for the caller to throw — so the bare call left this function
 * falling through to `dictionaries[locale]()` with a key that does not exist,
 * which is a crash rather than a 404. The difference is invisible at the call
 * site and is exactly the kind of thing a like-for-like port gets wrong.
 */
export const getDictionary = async (locale: string = defaultLocale) => {
  if (!isLocale(locale)) {
    throw notFound();
  }

  return dictionaries[locale]();
};
