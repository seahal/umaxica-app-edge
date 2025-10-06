import { describe, expect, it } from "vitest";

import routes from "../src/routes";

describe("org route manifest", () => {
	it("includes the index route", () => {
		const homepage = routes.find(
			(entry) => entry.index && entry.file === "routes/_index.tsx",
		);
		expect(homepage).toBeTruthy();
	});

	it("registers the configure route", () => {
		expect(routes.find((entry) => entry.path === "configure")).toMatchObject({
			path: "configure",
			file: "routes/configure.tsx",
		});
	});

	it("registers the about route", () => {
		expect(routes.find((entry) => entry.path === "about")).toMatchObject({
			path: "about",
			file: "routes/about.tsx",
		});
	});

	it("registers the sample route", () => {
		expect(routes.find((entry) => entry.path === "sample")).toMatchObject({
			path: "sample",
			file: "routes/sample.tsx",
		});
	});

	it("registers the catch-all route", () => {
		expect(
			routes.find(
				(entry) => entry.path === "*" && entry.file === "routes/catch-all.tsx",
			),
		).toBeTruthy();
	});

	it("preserves the expected order", () => {
		expect(routes).toEqual([
			expect.objectContaining({ index: true, file: "routes/_index.tsx" }),
			expect.objectContaining({
				path: "configure",
				file: "routes/configure.tsx",
			}),
			expect.objectContaining({ path: "about", file: "routes/about.tsx" }),
			expect.objectContaining({ path: "sample", file: "routes/sample.tsx" }),
			expect.objectContaining({ path: "*", file: "routes/catch-all.tsx" }),
		]);
	});
});
