import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const routeModule = await import("../../src/routes/configure");
const { loader, meta, default: ConfigureRoute } = routeModule;

function runLoader(env: Record<string, unknown>) {
	return loader({
		context: { cloudflare: { env } },
	} as never);
}

describe("Route: configure (com)", () => {
	it("declares title and description metadata", () => {
		const entries = meta({} as never);
		expect(entries).toContainEqual({ title: "configure" });
		expect(entries).toContainEqual({
			name: "description",
			content: "Welcome to React Router!",
		});
	});

	it("returns Cloudflare derived message from the loader", () => {
		const result = runLoader({ VALUE_FROM_CLOUDFLARE: "hello" });
		expect(result).toEqual({ message: "hello" });
	});

	it("renders configuration sections", () => {
		const markup = renderToStaticMarkup(
			<ConfigureRoute loaderData={{ message: "hello" }} />,
		);

		expect(markup).toContain("Configuration");
		expect(markup).toContain("acccount");
		expect(markup).toContain("preferences");
	});
});
