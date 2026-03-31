export const defaultLocale = 'ja';
export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const isLocale = (value: string): value is Locale => locales.includes(value as Locale);
