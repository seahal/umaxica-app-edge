import type { Dispatch, SetStateAction } from 'react';
import '../../test-setup.ts';

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

type MockedUseState = <S>(initialState: S | (() => S)) => [S, Dispatch<SetStateAction<S>>];

async function importEventListWithFilter(filterCategory: string) {
  vi.resetModules();
  vi.doMock('react', async () => {
    const actual = (await vi.importActual('react')) as Record<string, unknown> & {
      useState: MockedUseState;
    };

    return {
      ...actual,
      useState: ((initial: unknown) => [
        filterCategory ?? initial,
        vi.fn(),
      ]) as unknown as MockedUseState,
    };
  });

  return import('../../src/components/EventList');
}

afterEach(() => {
  vi.doUnmock('react');
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe('EventList edge states', () => {
  it('renders the empty-state view when no events match the filter', async () => {
    const { EventList } = await importEventListWithFilter('unknown-category');

    render(<EventList />);

    expect(screen.getByText('該当するイベントが見つかりませんでした')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });
});
