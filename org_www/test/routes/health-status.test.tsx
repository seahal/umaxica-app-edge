import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const routeModule = await import("../../src/routes/healths/_index");
const { loader, meta, default: HealthRoute } = routeModule;

function runLoader(env: Record<string, unknown>) {
  return loader({
    context: { cloudflare: { env } },
  } as never);
}

describe("Route: /health (org)", () => {
  it("declares description metadata", () => {
    expect(meta({} as never)).toEqual([{ name: "description", content: "status page" }]);
  });

  it("returns Cloudflare derived message values", () => {
    const result = runLoader({ VALUE_FROM_CLOUDFLARE: "healthy" });
    expect(result).toEqual({ message: "healthy" });
  });

  it("renders the health status content", () => {
    const markup = renderToStaticMarkup(<HealthRoute loaderData={{ message: "healthy" }} />);

    expect(markup).toContain("<h2>ok</h2>");
  });
});
