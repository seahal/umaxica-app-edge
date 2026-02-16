import { afterAll, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const actualNotFound = await import("../../src/components/NotFoundPage");
let renderCount = 0;

mock.module("../../src/components/NotFoundPage", () => ({
  ...actualNotFound,
  NotFoundPage: () => {
    renderCount += 1;
    return <div data-testid="not-found" />;
  },
}));

const routeModule = await import("../../src/routes/catch-all");
const { loader, meta, default: CatchAll } = routeModule;

afterAll(() => {
  mock.module("../../src/components/NotFoundPage", () => actualNotFound);
});

describe("Route: catch-all (org)", () => {
  it("exposes 404 metadata with robots rules", () => {
    const entries = meta({} as never);
    expect(entries).toContainEqual({
      title: "404 - ページが見つかりません | UMAXICA",
    });
    expect(entries).toContainEqual({
      name: "robots",
      content: "noindex, nofollow",
    });
  });

  it("throws a 404 response from the loader", () => {
    expect(() => loader({} as never)).toThrowError(Response);
    try {
      loader({} as never);
    } catch (error) {
      const response = error as Response;
      expect(response.status).toBe(404);
      expect(response.statusText).toBe("ページが見つかりません");
    }
  });

  it("renders the not found page component", () => {
    renderCount = 0;
    const markup = renderToStaticMarkup(<CatchAll />);

    expect(markup).toContain('data-testid="not-found"');
    expect(renderCount).toBe(1);
  });
});
