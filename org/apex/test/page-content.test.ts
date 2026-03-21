import { buildApexTitle, getAboutMeta, renderAboutContent } from '../src/page-content';

describe('org/apex page-content', () => {
  describe('buildApexTitle', () => {
    it('builds title with page name', () => {
      const env = {} as never;
      const result = buildApexTitle(env, 'org', 'About');
      expect(result).toBe('About | UMAXICA (org) - Apex');
    });

    it('builds title without page name', () => {
      const env = {} as never;
      const result = buildApexTitle(env, 'org');
      expect(result).toBe('UMAXICA (org) - Apex');
    });
  });

  describe('getAboutMeta', () => {
    it('returns meta object with title, description, canonical and robots', () => {
      const env = {} as never;
      const result = getAboutMeta(env);

      expect(result.title).toContain('About');
      expect(result.description).toContain('umaxica.org');
      expect(result.canonical).toBe('https://umaxica.org/about');
      expect(result.robots).toBe('index,follow');
    });
  });

  describe('renderAboutContent', () => {
    it('renders Japanese content when language is ja', () => {
      const result = renderAboutContent('ja');
      // Check that it returns a JSX element
      expect(result).toBeDefined();
      // The Japanese content should be in the props
      const children = result.props.children;
      expect(children).toBeDefined();
    });

    it('renders English content when language is not ja', () => {
      const result = renderAboutContent('en');
      expect(result).toBeDefined();
      const children = result.props.children;
      expect(children).toBeDefined();
    });

    it('renders English content when language is undefined', () => {
      const result = renderAboutContent(undefined);
      expect(result).toBeDefined();
      const children = result.props.children;
      expect(children).toBeDefined();
    });

    it('renders different content for Japanese vs English', () => {
      const japaneseResult = renderAboutContent('ja');
      const englishResult = renderAboutContent('en');

      // Both should return different content
      expect(JSON.stringify(japaneseResult)).not.toBe(JSON.stringify(englishResult));
    });
  });
});
