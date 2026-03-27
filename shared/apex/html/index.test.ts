import { describe, expect, it } from 'vite-plus/test';
import {
  buildHealthPageHtml,
  getBrandName,
  createBadRequestFallback,
  createNotFoundFallback,
  buildHealthErrorHtml,
} from './index';

describe('html index exports', () => {
  it('exports health page utilities', () => {
    expect(typeof buildHealthPageHtml).toBe('function');
    expect(typeof getBrandName).toBe('function');
  });

  it('exports fallback page utilities', () => {
    expect(typeof createBadRequestFallback).toBe('function');
    expect(typeof createNotFoundFallback).toBe('function');
    expect(typeof buildHealthErrorHtml).toBe('function');
  });

  it('getBrandName returns correct brand names', () => {
    expect(getBrandName({ BRAND_NAME: 'UMAXICA (com)' })).toBe('UMAXICA (com)');
    expect(getBrandName({ BRAND_NAME: 'UMAXICA (org)' })).toBe('UMAXICA (org)');
    expect(getBrandName({ BRAND_NAME: 'UMAXICA (app)' })).toBe('UMAXICA (app)');
    expect(getBrandName({ BRAND_NAME: 'UMAXICA Network' })).toBe('UMAXICA Network');
    expect(getBrandName({})).toBe('UMAXICA');
    expect(getBrandName(undefined)).toBe('UMAXICA');
  });
});
