import { describe, expect, it } from "bun:test";

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

const findByPath = (path: string) =>
	manifest.find((entry) => entry.path === path);
const findByFile = (file: string) =>
	manifest.find((entry) => entry.file === file);

describe("com route manifest", () => {
	it("wraps primary routes with the decorated layout", () => {
		const decorated = routes[0];
		expect(decorated).toMatchObject({ file: "../src/layouts/decorated.tsx" });
		expect(decorated?.children ?? []).toEqual([
			expect.objectContaining({ index: true, file: "routes/_index.tsx" }),
			expect.objectContaining({
				path: "configure",
				file: "routes/configure.tsx",
			}),
		]);
	});

	it("includes the application index route", () => {
		expect(findByFile("routes/_index.tsx")).toMatchObject({
			file: "routes/_index.tsx",
			index: true,
		});
	});

	it("registers the configure route", () => {
		expect(findByPath("configure")).toMatchObject({
			path: "configure",
			file: "routes/configure.tsx",
		});
	});

	it("exposes the explore index route", () => {
		expect(findByPath("explore")).toMatchObject({
			path: "explore",
			file: "routes/explore/_index.tsx",
			index: true,
		});
	});

	it("registers the baremetal layout for health checks", () => {
		expect(findByFile("../src/layouts/baremetal.tsx")).toBeDefined();
	});

	it("exposes the /health route", () => {
		expect(findByPath("/health")).toMatchObject({
			path: "/health",
			file: "routes/healths/_index.tsx",
		});
	});
});
