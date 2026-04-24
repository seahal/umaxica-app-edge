import { describe, it, expect } from 'vite-plus/test';
import { buildApexTitle, buildHealthPageHtml } from '../src/site';

describe('org/apex/src/site.ts', () => {
  describe('buildApexTitle', () => {
    it('returns base title without pageName', () => {
      const title = buildApexTitle();
      expect(title).toBe('UMAXICA (org) - Apex');
    });

    it('returns title with pageName', () => {
      const title = buildApexTitle('About');
      expect(title).toBe('About | UMAXICA (org) - Apex');
    });
  });

  describe('buildHealthPageHtml', () => {
    it('renders health page with brand name and timestamp', () => {
      const html = buildHealthPageHtml('UMAXICA', '2024-01-01T00:00:00.000Z');
      expect(html).toContain('UMAXICA');
      expect(html).toContain('<title>UMAXICA (org) - Apex</title>');
      expect(html).toContain('<strong>Status:</strong> OK');
      expect(html).toContain('<strong>Timestamp:</strong> 2024-01-01T00:00:00.000Z');
      expect(html).toContain('umaxica.org');
    });

    it('renders health page with revision info', () => {
      const revision = { id: 'abc123', tag: 'v1.0.0', timestamp: '2024-06-01T12:00:00.000Z' };
      const html = buildHealthPageHtml('UMAXICA', '2024-01-01T00:00:00.000Z', revision);
      expect(html).toContain('<strong>Revision ID:</strong> abc123');
      expect(html).toContain('<strong>Revision Tag:</strong> v1.0.0');
      expect(html).toContain('<strong>Revision Time:</strong> 2024-06-01T12:00:00.000Z');
    });
  });
});
