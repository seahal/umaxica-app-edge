import '../../test-setup.ts';

import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import DecoratedLayout from '../../src/layouts/decorated';

let rootLoaderDataOverride: {
  codeName?: string;
  newsServiceUrl?: string;
  docsServiceUrl?: string;
  helpServiceUrl?: string;
} | null = {
  codeName: 'MOCK_BRAND',
  newsServiceUrl: 'news.mock.com',
};

vi.mock('react-router', async (importOriginal) => {
  const actual = await (importOriginal as () => Promise<Record<string, unknown>>)();
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
    useRouteLoaderData: (id: string) => {
      if (id === 'root') {
        return rootLoaderDataOverride;
      }
      return null;
    },
  };
});

describe('DecoratedLayout (com)', () => {
  it('renders header and footer with loader data', () => {
    rootLoaderDataOverride = {
      codeName: 'MOCK_BRAND',
      newsServiceUrl: 'news.mock.com',
    };

    const Stub = createRoutesStub([
      {
        Component: DecoratedLayout,
        path: '*',
      },
    ]);
    render(<Stub initialEntries={['/']} />);

    expect(screen.getAllByText('MOCK_BRAND').length).toBeGreaterThan(0);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '📰' })).toHaveAttribute(
      'href',
      'https://news.mock.com',
    );
  });

  it('falls back to empty root loader data when it is unavailable', () => {
    rootLoaderDataOverride = null;

    const Stub = createRoutesStub([
      {
        Component: DecoratedLayout,
        path: '*',
      },
    ]);
    render(<Stub initialEntries={['/']} />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByText('MOCK_BRAND')).toBeNull();
  });
});
