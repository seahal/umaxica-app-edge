import { describe, expect, it } from "bun:test";

import { loader } from "../src/root";

type LoaderContext = {
	cloudflare?: { env?: Record<string, string> };
	security?: { nonce?: string };
};

async function runLoader(context: LoaderContext) {
	return loader({ context } as unknown as Parameters<typeof loader>[0]);
}

describe("dev root loader", () => {
	it("maps environment values for header/footer configuration", async () => {
		const result = await runLoader({
			cloudflare: {
				env: {
					BRAND_NAME: "Umaxica Dev Hub",
					HELP_SERVICE_URL: "help.dev.umaxica.app",
					DOCS_SERVICE_URL: "docs.dev.umaxica.app",
					NEWS_SERVICE_URL: "news.dev.umaxica.app",
				},
			},
			security: { nonce: "test-nonce" },
		});

		expect(result).toMatchObject({
			codeName: "Umaxica Dev Hub",
			helpServiceUrl: "help.dev.umaxica.app",
			docsServiceUrl: "docs.dev.umaxica.app",
			newsServiceUrl: "news.dev.umaxica.app",
			cspNonce: "test-nonce",
		});
	});

	it("generates a nonce when not provided", async () => {
		const context: LoaderContext = {};
		const result = await runLoader(context);

		expect(typeof result.cspNonce).toBe("string");
		expect(result.cspNonce.length).toBeGreaterThan(0);
		expect(context.security?.nonce).toBe(result.cspNonce);
	});
});
