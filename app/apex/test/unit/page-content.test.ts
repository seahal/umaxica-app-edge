import { buildApexTitle, getAboutMeta, renderAboutContent } from '../../src/page-content';

describe('page-content', () => {
  describe('buildApexTitle', () => {
    it('builds title with page name', () => {
      const env = {} as never;
      const result = buildApexTitle(env, 'app', 'About');
      expect(result).toBe('About | UMAXICA (app) - Apex');
    });

    it('builds title without page name', () => {
      const env = {} as never;
      const result = buildApexTitle(env, 'app');
      expect(result).toBe('UMAXICA (app) - Apex');
    });
  });

  describe('getAboutMeta', () => {
    it('returns meta object with title, description, canonical and robots', () => {
      const env = {} as never;
      const result = getAboutMeta(env);

      expect(result.title).toContain('About');
      expect(result.description).toContain('umaxica.app');
      expect(result.canonical).toBe('https://umaxica.app/about');
      expect(result.robots).toBe('index,follow');
    });
  });

  describe('renderAboutContent', () => {
    it('renders Japanese content when language is ja', () => {
      const result = renderAboutContent('ja');
      expect(result.props.children).toBeDefined();
    });

    it('renders English content when language is not ja', () => {
      const result = renderAboutContent('en');
      expect(result.props.children).toBeDefined();
    });

    it('renders English content when language is undefined', () => {
      const result = renderAboutContent(undefined);
      expect(result.props.children).toBeDefined();
    });
  });
});
