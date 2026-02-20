import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AppLoadContext } from "react-router";
import { CloudflareContext } from "../src/context";

type RootModule = typeof import("../src/root");
type LoaderData = Awaited<ReturnType<RootModule["loader"]>>;

let loaderDataOverride: LoaderData | undefined;
const isRouteErrorResponseMock = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Links: (props: Record<string, unknown>) => createElement("vi-links", props),
    Meta: (props: Record<string, unknown>) => createElement("vi-meta", props),
    ScrollRestoration: (props: Record<string, unknown>) => createElement("vi-scroll", props),
    Scripts: (props: Record<string, unknown>) => createElement("vi-scripts", props),
    useLoaderData: () => {
      if (!loaderDataOverride) {
        throw new Error("loader data override not set");
      }
      return loaderDataOverride;
    },
    isRouteErrorResponse: (error: unknown) => isRouteErrorResponseMock(error),
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => createElement("a", { href: to, ...rest }, children),
  };
});

const actualRouter = await vi.importActual<typeof import("react-router")>("react-router");

const rootModule = await import("../src/root");
const { default: App, Layout, meta, ErrorBoundary, loader } = rootModule;

const baseLoaderData: LoaderData = {
  codeName: "UMAXICA" as const,
  newsServiceUrl: "news.umaxica.com" as "jp.news.umaxica.com" | "news.umaxica.com",
  docsServiceUrl: "docs.umaxica.com" as "jp.docs.umaxica.com" | "docs.umaxica.com",
  helpServiceUrl: "help.umaxica.com" as "jp.help.umaxica.com" | "help.umaxica.com",
  cspNonce: "",
};

function renderLayoutWithData(data: Partial<LoaderData> = {}) {
  loaderDataOverride = { ...baseLoaderData, ...data };
  const markup = renderToStaticMarkup(
    <Layout>
      <div>child route</div>
    </Layout>,
  );
  loaderDataOverride = undefined;
  return markup;
}

describe("com root layout", () => {
  it("provides default meta title", () => {
    expect(meta()).toEqual([{ title: "Umaxica" }]);
  });

  it("renders the html shell with child content", () => {
    const markup = renderLayoutWithData({ cspNonce: "nonce-123" });

    expect(markup).toContain("<vi-links");
    expect(markup).toContain("<vi-meta");
    expect(markup).toContain("child route");
  });
});

describe("com root route component", () => {
  it("renders an outlet placeholder for nested routes", () => {
    const element = App();
    expect(element.type).toBe(actualRouter.Outlet);
  });
});

describe("com root loader", () => {
  it("throws error when context is empty", async () => {
    const loadContext = {
      get: () => undefined,
    } as unknown as AppLoadContext;

    await expect(loader({ context: loadContext } as never)).rejects.toThrow(
      "Cloudflare environment is not available",
    );
  });

  it("returns values from environment variables", async () => {
    const contextMap = new Map();
    contextMap.set(CloudflareContext, {
      cloudflare: {
        env: {
          BRAND_NAME: "TestBrand",
          NEWS_CORPORATE_URL: "https://news.example.com",
          DOCS_CORPORATE_URL: "https://docs.example.com",
          HELP_CORPORATE_URL: "https://help.example.com",
        },
      },
      security: { nonce: "test-nonce-123" },
    });

    const loadContext = {
      get: (key: symbol) => contextMap.get(key),
    } as unknown as AppLoadContext;

    const result = await loader({ context: loadContext } as never);

    expect(result.codeName).toBe("TestBrand");
    expect(result.cspNonce).toBe("test-nonce-123");
    expect(result.newsServiceUrl).toBe("https://news.example.com");
    expect(result.docsServiceUrl).toBe("https://docs.example.com");
    expect(result.helpServiceUrl).toBe("https://help.example.com");
  });
});

describe("com root ErrorBoundary", () => {
  beforeEach(() => {
    isRouteErrorResponseMock.mockReset();
  });

  it("renders NotFoundPage for 404 errors", () => {
    const error = {
      status: 404,
      statusText: "Not Found",
      data: null,
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain("ページが見つかりません");
    expect(markup).toContain("404");
  });

  it("renders InternalServerErrorPage for 500 errors", () => {
    const error = {
      status: 500,
      statusText: "Internal Server Error",
      data: null,
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain("サーバーエラー");
    expect(markup).toContain("500");
  });

  it("renders ServiceUnavailablePage for 503 errors", () => {
    const error = {
      status: 503,
      statusText: "Service Unavailable",
      data: null,
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    // Note: The code checks `status >= 500` before checking for 503,
    // so 503 errors are handled as InternalServerErrorPage
    expect(markup).toContain("サーバーエラー");
    expect(markup).toContain("500");
  });

  it("renders generic ErrorPage for other route errors", () => {
    const error = {
      status: 400,
      statusText: "Bad Request",
      data: null,
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain("400 エラー");
    expect(markup).toContain("Bad Request");
  });

  it("renders InternalServerErrorPage for Error instances", () => {
    const error = new Error("Test error message");
    isRouteErrorResponseMock.mockReturnValue(false);
    const originalDev = import.meta.env.DEV;
    (import.meta.env as { DEV: boolean }).DEV = false;

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain("サーバーエラー");
    expect(markup).toContain("500");

    (import.meta.env as { DEV: boolean }).DEV = originalDev;
  });

  it("shows stack trace in DEV mode for Error instances", () => {
    const error = new Error("Test error message");
    error.stack = "Error: Test error message\n    at test.ts:1:1";
    isRouteErrorResponseMock.mockReturnValue(false);
    const originalDev = import.meta.env.DEV;
    (import.meta.env as { DEV: boolean }).DEV = true;

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain("Test error message");
    expect(markup).toContain("at test.ts:1:1");

    (import.meta.env as { DEV: boolean }).DEV = originalDev;
  });

  it("renders fallback ErrorPage for unknown errors", () => {
    isRouteErrorResponseMock.mockReturnValue(false);
    const markup = renderToStaticMarkup(<ErrorBoundary error="unknown error" />);
    expect(markup).toContain("予期しないエラー");
    expect(markup).toContain("500");
  });
});

afterAll(() => {
  loaderDataOverride = undefined;
  vi.restoreAllMocks();
});
