import { describe, expect, it, vi, beforeEach, afterEach } from 'vite-plus/test';
import { createApexApp } from '../create-apex-app';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

describe('createApexApp', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const mockRenderer = vi.fn(async (c) => c.text('OK'));
  const mockGetAboutMeta = vi.fn(() => ({ title: 'About' }));
  const mockRenderAboutContent = vi.fn(() => 'about content');

  it('creates app with redirect handler', () => {
    const app = createApexApp({
      rootHandler: 'redirect',
      rootRedirect: {
        resolveRedirectUrl: () => '/org',
        getDefaultRedirectUrl: () => '/org',
        buildRegionErrorPayload: () => ({ error: 'error', message: 'message' }),
      },
      getAboutMeta: mockGetAboutMeta,
      renderAboutContent: mockRenderAboutContent,
      renderer: mockRenderer,
    });

    expect(app).toBeInstanceOf(Hono);
  });

  it('creates app with page handler', () => {
    const app = createApexApp({
      rootHandler: 'page',
      getRootMeta: () => ({ title: 'Home' }),
      renderRootContent: () => 'home content',
      getAboutMeta: mockGetAboutMeta,
      renderAboutContent: mockRenderAboutContent,
      renderer: mockRenderer,
    });

    expect(app).toBeInstanceOf(Hono);
  });

  it('creates app with page handler but missing optional config', () => {
    const app = createApexApp({
      rootHandler: 'page',
      getAboutMeta: mockGetAboutMeta,
      renderAboutContent: mockRenderAboutContent,
      renderer: mockRenderer,
    });

    expect(app).toBeInstanceOf(Hono);
  });

  it('handles Error objects in error handler', async () => {
    const app = createApexApp({
      rootHandler: 'page',
      getRootMeta: () => ({ title: 'Home' }),
      renderRootContent: () => 'home content',
      getAboutMeta: mockGetAboutMeta,
      renderAboutContent: mockRenderAboutContent,
      renderer: async () => {
        throw new Error('test error');
      },
    });

    const req = new Request('https://example.com');
    await app.fetch(req);

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Unhandled apex error',
      expect.objectContaining({
        message: 'test error',
        stack: expect.any(String),
      }),
    );
  });

  it('handles HTTPException in error handler', async () => {
    const app = createApexApp({
      rootHandler: 'page',
      getRootMeta: () => ({ title: 'Home' }),
      renderRootContent: () => 'home content',
      getAboutMeta: mockGetAboutMeta,
      renderAboutContent: mockRenderAboutContent,
      renderer: async () => {
        throw new HTTPException(401, { message: 'unauthorized' });
      },
    });

    const req = new Request('https://example.com');
    const res = await app.fetch(req);

    expect(res.status).toBe(401);
    // HTTPException should not trigger console.error in our handler
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
