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
const { Layout } = rootModule;

const baseLoaderData: LoaderData = {
  codeName: "UMAXICA" as const,
  newsUrl: "jp.news.umaxica.org" as const,
  docsUrl: "jp.docs.umaxica.org" as const,
  helpUrl: "jp.help.umaxica.org" as const,
  cspNonce: "",
};

function renderLayoutWithData(data: Partial<LoaderData> = {}) {
  loaderDataOverride = { ...baseLoaderData, ...data };
  const markup = renderToStaticMarkup(
    <Layout>
      <div>Child Content</div>
    </Layout>,
  );
  loaderDataOverride = undefined;
  return markup;
}

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Root layout (org)", () => {
  it("renders html shell with children", () => {
    const markup = renderLayoutWithData();
    expect(markup).toContain("Child Content");
    expect(markup).toContain("<vi-links");
    expect(markup).toContain("<vi-meta");
  });

  it("applies nonce to scripts and scroll restoration", () => {
    const markup = renderLayoutWithData({ cspNonce: "test-nonce" });
    expect(markup).toContain('nonce="test-nonce"');
  });
});
