import { describe, expect, it } from 'vite-plus/test';
import { getJitWorkspaceEnvName, getJitWorkspaceUrl } from './jit-url';

describe('shared/web/jit-url', () => {
  it('builds the expected env var name', () => {
    expect(getJitWorkspaceEnvName('APP', 'CORE')).toBe('JIT_APP_CORE_URL');
    expect(getJitWorkspaceEnvName('COM', 'DOCS')).toBe('JIT_COM_DOCS_URL');
    expect(getJitWorkspaceEnvName('ORG', 'NEWS')).toBe('JIT_ORG_NEWS_URL');
  });

  it('normalizes the workspace url', () => {
    expect(
      getJitWorkspaceUrl('APP', 'CORE', {
        JIT_APP_CORE_URL: 'http://localhost:5171/',
      }),
    ).toBe('http://localhost:5171');
  });

  it('returns null when the workspace url is missing', () => {
    expect(getJitWorkspaceUrl('APP', 'CORE', {})).toBeNull();
  });
});
