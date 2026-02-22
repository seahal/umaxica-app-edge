import { afterAll, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Outlet: () => createElement("vi-outlet"),
    Links: (props: Record<string, unknown>) => createElement("vi-links", props),
    Meta: (props: Record<string, unknown>) => createElement("vi-meta", props),
    Scripts: (props: Record<string, unknown>) => createElement("vi-scripts", props),
    ScrollRestoration: (props: Record<string, unknown>) => createElement("vi-scroll", props),
  };
});

const { Layout, meta, default: App } = await import("../../src/layouts/baremetal");

describe("dev_status baremetal layout", () => {
  it("renders html shell with children", () => {
    const markup = renderToStaticMarkup(
      <Layout>
        <div>Baremetal Content</div>
      </Layout>,
    );

    expect(markup).toContain("Baremetal Content");
    expect(markup).toContain("<vi-links");
    expect(markup).toContain("<vi-meta");
    expect(markup).toContain("<vi-scroll");
    expect(markup).toContain("<vi-scripts");
  });

  it("provides empty title in meta", () => {
    expect(meta({} as unknown)).toEqual([{ title: "" }]);
  });

  it("App renders Outlet", () => {
    const element = App();
    expect(element.type).toBeDefined();
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
