import { renderToStaticMarkup } from 'react-dom/server';

vi.mock(import('../../src/components/EventList'), async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    EventList: () => <div data-testid="event-list" />,
  };
});

const routeModule = await import('../../src/routes/_index');
const { loader, meta, default: HomeRoute } = routeModule;

afterAll(() => {
  vi.restoreAllMocks();
});

function runLoader(env: Record<string, unknown>) {
  return loader({
    context: { cloudflare: { env } },
  } as never);
}

describe('Route: home (org)', () => {
  it('defines localized metadata', () => {
    const entries = meta({} as never);
    expect(entries).toContainEqual({
      title: 'Umaxica Organization - イベント一覧',
    });
    expect(entries).toContainEqual({
      content: 'コミュニティイベントに参加しましょう',
      name: 'description',
    });
  });

  it('injects Cloudflare env values via the loader', () => {
    const result = runLoader({ VALUE_FROM_CLOUDFLARE: 'edge-ready' });
    expect(result).toStrictEqual({ message: 'edge-ready' });
  });

  it('renders the event list component', () => {
    const markup = renderToStaticMarkup(<HomeRoute loaderData={{ message: '' }} />);
    expect(markup).toContain('data-testid="event-list"');
  });
});
