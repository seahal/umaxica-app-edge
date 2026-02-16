import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CloudflareContext } from "../../src/context";

const routeModule = await import("../../src/routes/explore/_index");
const { loader, meta, default: ExploreRoute } = routeModule;

function createMockContext(env: Record<string, unknown>) {
  const contextMap = new Map();
  contextMap.set(CloudflareContext, {
    cloudflare: { env },
  });

  return {
    get: (key: symbol) => contextMap.get(key),
  };
}

describe("Route: explore (com)", () => {
  it("exposes meaningful metadata", () => {
    const entries = meta({} as never);

    expect(entries).toContainEqual({ title: "Umaxica Commerce | Explore" });
    expect(entries).toContainEqual({
      name: "description",
      content: "検索レイアウトでサービスやチームシグナルを横断的に探索します。",
    });
  });

  it("loads helper message from Cloudflare context", () => {
    const context = createMockContext({ VALUE_FROM_CLOUDFLARE: "hello" });
    const result = loader({ context } as never);

    expect(result).toEqual({ message: "hello" });
  });

  it("renders the search layout with filters, results, and side panels", () => {
    const markup = renderToStaticMarkup(<ExploreRoute loaderData={{ message: "Helper text" }} />);

    expect(markup).toContain("Umaxica を横断検索");
    expect(markup).toContain("検索キーワード");
    expect(markup).toContain("検索フィルター");
    expect(markup).toContain("保存済みビュー");
    expect(markup).toContain("ライブシグナル");
    expect(markup).toContain("Helper text");
  });
});
