import { describe, expect, it } from "bun:test";

import routes from "../src/routes";

describe("route manifest", () => {
	it("lists the homepage index route", () => {
		const homepageRoute = routes.find(
			(entry) => entry.index && entry.file === "routes/_index.tsx",
		);
		expect(homepageRoute).toBeTruthy();
	});

	it("lists the about route", () => {
		const about = routes.find((entry) => entry.path === "about");
		expect(about).toMatchObject({ path: "about", file: "routes/about.tsx" });
	});

	it("lists the sample route", () => {
		const sample = routes.find((entry) => entry.path === "sample");
		expect(sample).toMatchObject({ path: "sample", file: "routes/sample.tsx" });
	});

	it("lists the configure route", () => {
		const configure = routes.find((entry) => entry.path === "configure");
		expect(configure).toMatchObject({
			path: "configure",
			file: "routes/configure.tsx",
		});
	});

	it("matches the expected manifest order", () => {
		expect(routes).toEqual([
			expect.objectContaining({ index: true, file: "routes/_index.tsx" }),
			expect.objectContaining({ path: "about", file: "routes/about.tsx" }),
			expect.objectContaining({ path: "sample", file: "routes/sample.tsx" }),
			expect.objectContaining({
				path: "configure",
				file: "routes/configure.tsx",
			}),
		]);
	});
});
