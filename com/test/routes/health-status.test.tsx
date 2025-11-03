import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const routeModule = await import("../../src/routes/healths/_index");
const { loader, meta, default: HealthRoute } = routeModule;

function runLoader(env: Record<string, unknown>) {
	return loader({
		context: { cloudflare: { env } },
	} as never);
}

describe("Route: /health (com)", () => {
	it("returns description metadata", () => {
		expect(meta({} as never)).toEqual([
			{ name: "description", content: "status page" },
		]);
	});

	it("returns Cloudflare-sourced message data", () => {
		const result = runLoader({ VALUE_FROM_CLOUDFLARE: "status" });
		expect(result).toEqual({ message: "status" });
	});

	it("renders the health status shell", () => {
		const markup = renderToStaticMarkup(
			<HealthRoute loaderData={{ message: "ok" }} />,
		);

		expect(markup).toContain("<h2>ok</h2>");
	});
});
