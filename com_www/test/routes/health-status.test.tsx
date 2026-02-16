import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CloudflareContext } from "../../src/context";

const routeModule = await import("../../src/routes/healths/_index");
const { loader, meta, default: HealthRoute } = routeModule;

function createMockContext(env: Record<string, unknown>) {
  const contextMap = new Map();
  contextMap.set(CloudflareContext, {
    cloudflare: { env },
  });

  return {
    get: (key: symbol) => contextMap.get(key),
  };
}

function runLoader(env: Record<string, unknown>) {
  const mockContext = createMockContext(env);
  return loader({
    context: mockContext,
  } as never);
}

describe("Route: /health (com)", () => {
  it("returns description metadata", () => {
    expect(meta({} as never)).toEqual([{ name: "description", content: "status page" }]);
  });

  it("returns Cloudflare-sourced message data", () => {
    const result = runLoader({ VALUE_FROM_CLOUDFLARE: "status" });
    expect(result).toEqual({ message: "status" });
  });

  it("renders the health status shell", () => {
    const markup = renderToStaticMarkup(<HealthRoute loaderData={{ message: "ok" }} />);

    expect(markup).toContain("<h2>ok</h2>");
  });
});
