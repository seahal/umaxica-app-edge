import { describe, expect, it } from "bun:test";

import { loader } from "../src/root";

type LoaderContext = {
	cloudflare?: { env?: Record<string, string> };
	security?: { nonce?: string };
};

async function runLoader(context: LoaderContext) {
	return loader({ context } as unknown as Parameters<typeof loader>[0]);
}

describe("root loader", () => {
	it("maps Cloudflare env values into loader data", async () => {
		const result = await runLoader({
			cloudflare: {
				env: {
					CODE_NAME: "Project Nova",
					HELP_SERVICE_URL: "support.umaxica.app",
					DOCS_SERVICE_URL: "docs.umaxica.app",
					NEWS_SERVICE_URL: "news.umaxica.app",
					API_SERVICE_URL: "api.umaxica.app",
					APEX_SERVICE_URL: "umaxica.app",
					EDGE_SERVICE_URL: "edge.umaxica.app",
				},
			},
			security: { nonce: "csp-nonce" },
		});
	});
});
