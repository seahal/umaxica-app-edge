import { render, screen } from '@testing-library/react';

vi.mock(import('../../src/components/DocsViewer'), () => ({
  DocsViewer: () => <div data-testid="docs-viewer">Docs Content</div>,
}));

const Home = await import('../../src/routes/home');

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Home route (dev/status)', () => {
  it('renders DocsViewer component', () => {
    render(<Home.default />);

    expect(screen.getByTestId('docs-viewer')).toBeInTheDocument();
    expect(screen.getByText('Docs Content')).toBeInTheDocument();
  });

  it('exports meta function with correct title and description', () => {
    const { meta } = Home;
    expect(meta).toBeDefined();

    const metaResult = meta({} as never);
    expect(metaResult).toStrictEqual([
      { title: 'Umaxica Developers - ドキュメント' },
      { content: 'React Aria Components のドキュメント', name: 'description' },
    ]);
  });
});
