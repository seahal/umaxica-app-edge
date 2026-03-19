import type { Dispatch, SetStateAction } from 'react';
import '../../test-setup.ts';

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { Selection } from 'react-aria-components';

type MockedUseMemo = <T>(factory: () => T) => T;
type MockedUseState = <S>(initialState: S | (() => S)) => [S, Dispatch<SetStateAction<S>>];

async function importExploreWithState(options: { query?: string; selectedKeys?: Selection }) {
  vi.resetModules();
  vi.doMock('react', async () => {
    const actual = (await vi.importActual('react')) as Record<string, unknown> & {
      useMemo: MockedUseMemo;
      useState: MockedUseState;
    };
    let callCount = 0;

    return {
      ...actual,
      useMemo: ((factory: () => unknown) => factory()) as unknown as MockedUseMemo,
      useState: ((initial: unknown) => {
        callCount += 1;

        if (callCount === 1) {
          return [options.query ?? initial, vi.fn()];
        }

        if (callCount === 2) {
          return [options.selectedKeys ?? initial, vi.fn()];
        }

        return [initial, vi.fn()];
      }) as unknown as MockedUseState,
    };
  });

  return import('../../src/routes/explore/_index');
}

afterEach(() => {
  vi.doUnmock('react');
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe('Explore route guard branches (com)', () => {
  it('supports an explicit "all" selection sentinel', async () => {
    const { default: Explore } = await importExploreWithState({
      query: '',
      selectedKeys: 'all',
    });

    render(<Explore loaderData={{ message: '' }} params={{}} matches={[]} />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
  });

  it('falls back to "all" when the selected key is not a string', async () => {
    const { default: Explore } = await importExploreWithState({
      query: '',
      selectedKeys: new Set([1]),
    });

    render(<Explore loaderData={{ message: '' }} params={{}} matches={[]} />);

    expect(screen.getAllByRole('article')).toHaveLength(6);
  });
});
