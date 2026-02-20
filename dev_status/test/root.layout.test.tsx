import { afterAll, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type RootModule = typeof import("../src/root");
type LoaderData = Awaited<ReturnType<RootModule["loader"]>>;

let loaderDataOverride: LoaderData | undefined;

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
  };
});

const rootModule = await import("../src/root");
const { Layout, loader } = rootModule;

const baseLoaderData: LoaderData = {
  codeName: "DEV_BRAND",
  newsServiceUrl: "news.dev",
  docsServiceUrl: "docs.dev",
  helpServiceUrl: "help.dev",
  cspNonce: "test-nonce",
};

function renderLayoutWithData(data: Partial<LoaderData> = {}) {
  loaderDataOverride = { ...baseLoaderData, ...data };
  const markup = renderToStaticMarkup(
    <Layout>
      <div>Dev Content</div>
    </Layout>,
  );
  loaderDataOverride = undefined;
  return markup;
}

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Root layout (dev_status)", () => {
  it("renders html shell with children", () => {
    const markup = renderLayoutWithData();
    expect(markup).toContain("Dev Content");
    expect(markup).toContain("<vi-links");
    expect(markup).toContain("<vi-meta");
  });

  it("applies nonce to scripts and scroll restoration", () => {
    const markup = renderLayoutWithData({ cspNonce: "custom-nonce" });
    expect(markup).toContain('nonce="custom-nonce"');
  });

  it("loader extracts environment variables", () => {
    const context = {
      cloudflare: {
        env: {
          BRAND_NAME: "ENV_BRAND",
        },
      },
    };
    const result = loader({
      context,
      params: {},
      request: new Request("http://localhost"),
    } as never);
    expect(result.codeName).toBe("ENV_BRAND");
  });
});
