import type { Dispatch, SetStateAction } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

type MockedUseState = <S>(initialState: S | (() => S)) => [S, Dispatch<SetStateAction<S>>];

async function importDocsViewerWithState(options: {
  searchQuery?: string;
  selectedSection?: string;
}) {
  vi.resetModules();
  vi.doMock('react', async () => {
    const actual = (await vi.importActual('react')) as Record<string, unknown> & {
      useState: MockedUseState;
    };
    let callCount = 0;

    return {
      ...actual,
      useState: ((initial: unknown) => {
        callCount += 1;

        if (callCount === 1) {
          return [options.searchQuery ?? initial, vi.fn()];
        }

        if (callCount === 2) {
          return [options.selectedSection ?? initial, vi.fn()];
        }

        return actual.useState(initial);
      }) as unknown as MockedUseState,
    };
  });

  return import('../../src/components/DocsViewer');
}

afterEach(() => {
  vi.doUnmock('react');
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe('DocsViewer edge states', () => {
  it('renders the empty-state view when the selected section is missing', async () => {
    const { DocsViewer } = await importDocsViewerWithState({
      selectedSection: 'missing-section',
    });

    render(<DocsViewer />);

    expect(screen.getByText('該当するドキュメントが見つかりませんでした')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });
});
