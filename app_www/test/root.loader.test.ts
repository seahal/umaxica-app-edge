import { describe, expect, it } from "vitest";

import { CloudflareContext } from "../src/context";
import { loader } from "../src/root";

type LoaderContext = {
  cloudflare?: { env?: Record<string, string> };
  security?: { nonce?: string };
};

function createMockContext(data: LoaderContext) {
  const contextMap = new Map();
  contextMap.set(CloudflareContext, data);

  return {
    get: (key: symbol) => contextMap.get(key),
  };
}

async function runLoader(context: LoaderContext) {
  const mockContext = createMockContext(context);
  return loader({ context: mockContext } as unknown as Parameters<typeof loader>[0]);
}

describe("root loader", () => {
  it("maps Cloudflare env values into loader data", async () => {
    const result = await runLoader({
      cloudflare: {
        env: {
          BRAND_NAME: "Project Nova",
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
    expect(result).toMatchObject({
      codeName: "Project Nova",
      helpServiceUrl: "support.umaxica.app",
      docsServiceUrl: "docs.umaxica.app",
      newsServiceUrl: "news.umaxica.app",
      apiServiceUrl: "api.umaxica.app",
      apexServiceUrl: "umaxica.app",
      edgeServiceUrl: "edge.umaxica.app",
      cspNonce: "csp-nonce",
    });
  });
});
