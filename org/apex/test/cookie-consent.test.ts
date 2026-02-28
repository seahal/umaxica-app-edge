import { parseConsentedCookie, shouldShowCookieBanner } from '../../../shared/consentState';

describe('parseConsentedCookie', () => {
  it('returns unknown for null', () => {
    expect(parseConsentedCookie(null)).toBe('unknown');
  });

  it('returns accepted for true', () => {
    expect(parseConsentedCookie('true')).toBe('accepted');
  });

  it('returns accepted for 1', () => {
    expect(parseConsentedCookie('1')).toBe('accepted');
  });

  it('returns denied for false', () => {
    expect(parseConsentedCookie('false')).toBe('denied');
  });

  it('returns denied for 0', () => {
    expect(parseConsentedCookie('0')).toBe('denied');
  });

  it('returns unknown for garbage values', () => {
    expect(parseConsentedCookie('garbage')).toBe('unknown');
  });
});

describe('shouldShowCookieBanner', () => {
  it('returns false for accepted state', () => {
    expect(shouldShowCookieBanner('accepted')).toBe(false);
  });

  it('returns true for denied state', () => {
    expect(shouldShowCookieBanner('denied')).toBe(true);
  });

  it('returns true for unknown state', () => {
    expect(shouldShowCookieBanner('unknown')).toBe(true);
  });
});
