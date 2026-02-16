import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const routeModule = await import("../../src/routes/sample");
const { meta, default: SampleRoute } = routeModule;

describe("Route: sample (org)", () => {
  it("declares route metadata", () => {
    const entries = meta({} as never);
    expect(entries).toContainEqual({ title: "sample - Umaxica Org" });
    expect(entries).toContainEqual({
      name: "description",
      content: "About this organization site",
    });
  });

  it("renders the sample page content", () => {
    const markup = renderToStaticMarkup(<SampleRoute />);

    expect(markup).toContain("Sample");
    expect(markup).toContain("about page for the org site");
  });
});
