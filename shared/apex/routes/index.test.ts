import { describe, expect, it } from 'vite-plus/test';
import { createHealthRoute, handleHealthError, createAboutRoute, createRootRoute } from './index';
import type {
  HealthBindings,
  HealthContext,
  AboutBindings,
  AboutContext,
  AboutConfig,
  Meta,
  RootBindings,
  RootContext,
  RootRedirectConfig,
  PageConfig,
} from './index';

describe('routes index exports', () => {
  it('exports health route utilities', () => {
    expect(typeof createHealthRoute).toBe('function');
    expect(typeof handleHealthError).toBe('function');
  });

  it('exports about route utilities', () => {
    expect(typeof createAboutRoute).toBe('function');
  });

  it('exports root route utilities', () => {
    expect(typeof createRootRoute).toBe('function');
  });

  it('type exports are respected (compilation test)', () => {
    // These are just type compilation checks
    const _checkHealthBindings: HealthBindings = { Bindings: { BRAND_NAME: 'test' } };
    const _checkHealthContext: HealthContext = {} as HealthContext;
    const _checkAboutBindings: AboutBindings = {} as AboutBindings;
    const _checkAboutContext: AboutContext = {} as AboutContext;
    const _checkAboutConfig: AboutConfig = {
      getAboutMeta: () => ({}),
      renderAboutContent: () => '',
    };
    const _checkMeta: Meta = { pageTitle: 'test' };
    const _checkRootBindings: RootBindings = {} as RootBindings;
    const _checkRootContext: RootContext = {} as RootContext;
    const _checkRootRedirectConfig: RootRedirectConfig = {} as RootRedirectConfig;
    const _checkPageConfig: PageConfig = { getRootMeta: () => ({}), renderRootContent: () => '' };

    expect(_checkHealthBindings).toBeDefined();
    expect(_checkAboutConfig).toBeDefined();
    expect(_checkMeta).toBeDefined();
    expect(_checkPageConfig).toBeDefined();
  });
});
