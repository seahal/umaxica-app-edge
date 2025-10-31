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

describe("route manifest", () => {
	it("includes the application index route", () => {
		expect(findByFile("routes/_index.tsx")).toMatchObject({
			file: "routes/_index.tsx",
			index: true,
		});
	});

	it("registers the decorated layout shell", () => {
		expect(findByFile("../src/layouts/decorated.tsx")).toBeDefined();
	});

	it.each([
		["configuration", "routes/configurations/_index.tsx"],
		["message", "routes/messages/_index.tsx"],
		["notification", "routes/notifications/_index.tsx"],
		["explore", "routes/explore/_index.tsx"],
		["authentication", "routes/authentication/_index.tsx"],
	])("exposes the %s index route", (path, file) => {
		expect(findByPath(path)).toMatchObject({ path, file });
	});

	it("includes the configuration child routes", () => {
		expect(findByPath("configuration")).toMatchObject({
			path: "configuration",
			index: true,
			file: "routes/configurations/_index.tsx",
		});
		expect(findByPath("configuration/account")).toMatchObject({
			path: "configuration/account",
			file: "routes/configurations/account.tsx",
		});
		expect(findByPath("configuration/preference")).toMatchObject({
			path: "configuration/preference",
			file: "routes/configurations/preference.tsx",
		});
	});

	it("exposes the baremetal health check", () => {
		expect(findByPath("/health")).toMatchObject({
			path: "/health",
			file: "routes/healths/_index.tsx",
		});
	});
});
