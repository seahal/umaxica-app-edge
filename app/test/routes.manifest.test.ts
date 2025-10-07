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
});
