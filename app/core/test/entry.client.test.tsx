const hydrateCalls: unknown[][] = [];
const originalDocument = globalThis.document as Document | undefined;
const originalWindow = globalThis.window as (Window & typeof globalThis) | undefined;

if (!originalDocument) {
  (globalThis as { document?: Document }).document = {
    nodeType: 9,
  } as unknown as Document;
}

if (!originalWindow) {
  (globalThis as { window?: Window & typeof globalThis }).window = {
    ENV: {},
  } as unknown as Window & typeof globalThis;
}

vi.mock(import('react-dom/client'), async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    hydrateRoot: (...args: unknown[]) => {
      hydrateCalls.push(args);
    },
  };
});

vi.mock(import('react-router/dom'), async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    HydratedRouter: () => null,
  };
});

vi.mock(import('@sentry/react-router'), () => ({
  captureException: vi.fn(() => {}),
  captureMessage: vi.fn(() => {}),
  init: vi.fn(() => {}),
}));

await import('../src/entry.client');

it('hydrates the app client entry without throwing', () => {
  expect(hydrateCalls.length).toBe(1);
  expect(hydrateCalls[0]?.[0]).toBe(document);
});

afterAll(() => {
  vi.restoreAllMocks();

  if (originalDocument) {
    globalThis.document = originalDocument;
  } else {
    delete (globalThis as { document?: Document }).document;
  }

  if (originalWindow) {
    globalThis.window = originalWindow;
  } else {
    delete (globalThis as { window?: Window & typeof globalThis }).window;
  }
});
