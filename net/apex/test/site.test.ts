import { describe, it, expect } from 'vite-plus/test';
import { buildApexTitle, buildHealthPageHtml } from '../src/site';

describe('net/apex/src/site.ts', () => {
  describe('buildApexTitle', () => {
    it('returns base title without pageName', () => {
      const title = buildApexTitle();
      expect(title).toBe('UMAXICA (net) - Apex');
    });

    it('returns title with pageName', () => {
      const title = buildApexTitle('About');
      expect(title).toBe('About | UMAXICA (net) - Apex');
    });
  });

  describe('buildHealthPageHtml', () => {
    it('renders health page with brand name and timestamp', () => {
      const html = buildHealthPageHtml('UMAXICA', '2024-01-01T00:00:00.000Z');
      expect(html).toContain('UMAXICA');
      expect(html).toContain('<title>UMAXICA (net) - Apex</title>');
      expect(html).toContain('<strong>Status:</strong> OK');
      expect(html).toContain('<strong>Timestamp:</strong> 2024-01-01T00:00:00.000Z');
      expect(html).toContain('umaxica.net');
    });
  });
});
