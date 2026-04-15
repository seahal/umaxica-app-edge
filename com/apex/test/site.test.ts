import { describe, it, expect } from 'vite-plus/test';
import { buildApexTitle, buildHealthPageHtml } from '../src/site';
import {
  renderAboutContent,
  getAboutMeta,
  buildApexTitle as buildApexTitleContent,
} from '../src/page-content';

describe('com/apex/src/site.ts', () => {
  describe('buildApexTitle', () => {
    it('returns base title without pageName', () => {
      const title = buildApexTitle();
      expect(title).toBe('UMAXICA (com) - Apex');
    });

    it('returns title with pageName', () => {
      const title = buildApexTitle('About');
      expect(title).toBe('About | UMAXICA (com) - Apex');
    });
  });

  describe('buildHealthPageHtml', () => {
    it('renders health page with brand name and timestamp', () => {
      const html = buildHealthPageHtml('UMAXICA', '2024-01-01T00:00:00.000Z');
      expect(html).toContain('UMAXICA');
      expect(html).toContain('<title>UMAXICA (com) - Apex</title>');
      expect(html).toContain('<strong>Status:</strong> OK');
      expect(html).toContain('<strong>Timestamp:</strong> 2024-01-01T00:00:00.000Z');
      expect(html).toContain('umaxica.com');
    });
  });

  describe('renderAboutContent', () => {
    it('renders English content when language is undefined', () => {
      const result = renderAboutContent(undefined);
      expect(result).toBeDefined();
      expect(result.props.children).toBeDefined();
    });

    it('renders Japanese content when language is ja', () => {
      const result = renderAboutContent('ja');
      expect(result).toBeDefined();
      expect(result.props.children).toBeDefined();
    });
  });

  describe('getAboutMeta', () => {
    it('returns meta with correct title', () => {
      const meta = getAboutMeta({} as never);
      expect(meta.title).toBe('About | UMAXICA (com) - Apex');
      expect(meta.description).toContain('umaxica.com');
      expect(meta.canonical).toBe('https://umaxica.com/about');
      expect(meta.robots).toBe('index,follow');
    });
  });

  describe('buildApexTitle (from page-content)', () => {
    it('wraps site title with env and domain params', () => {
      const title = buildApexTitleContent({} as never, 'com', 'Test');
      expect(title).toBe('Test | UMAXICA (com) - Apex');
    });
  });
});
