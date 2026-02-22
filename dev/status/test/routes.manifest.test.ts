import { describe, expect, it } from "vitest";

import routes from "../src/routes";

type RouteManifestEntry = {
  children?: RouteManifestEntry[];
  file?: string;
  index?: boolean;
  path?: string;
};

const flattenRoutes = (entries: RouteManifestEntry[]): RouteManifestEntry[] =>
  entries.reduce<RouteManifestEntry[]>((acc, entry) => {
    acc.push(entry);
    if (entry.children?.length) {
      acc.push(...flattenRoutes(entry.children));
    }
    return acc;
  }, []);

const manifest = flattenRoutes(routes as RouteManifestEntry[]);

const findByPath = (path: string) => manifest.find((entry) => entry.path === path);
const findByFile = (file: string) => manifest.find((entry) => entry.file === file);

describe("dev route manifest", () => {
  it("wraps the home route with the decorated layout", () => {
    const decorated = routes[0];
    expect(decorated).toMatchObject({ file: "../src/layouts/decorated.tsx" });
    expect(decorated?.children ?? []).toEqual([
      expect.objectContaining({ index: true, file: "routes/home.tsx" }),
    ]);
  });

  it("exposes the home index route", () => {
    expect(findByFile("routes/home.tsx")).toMatchObject({
      file: "routes/home.tsx",
      index: true,
    });
  });

  it("registers the baremetal health route", () => {
    expect(findByFile("../src/layouts/baremetal.tsx")).toBeDefined();
    expect(findByPath("/health")).toMatchObject({
      path: "/health",
      file: "routes/healths/_index.tsx",
    });
  });
});
