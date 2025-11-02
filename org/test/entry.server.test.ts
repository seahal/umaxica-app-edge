import type { AppLoadContext, EntryContext } from "react-router";

import { afterAll, expect, it, mock } from "bun:test";

const renderCalls: unknown[][] = [];
const actualReactDomServer = await import("react-dom/server");

mock.module("react-dom/server", () => ({
  ...actualReactDomServer,
  renderToReadableStream: (...args: unknown[]) => {
    renderCalls.push(args);
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
    return Object.assign(stream, {
      allReady: Promise.resolve(),
    });
  },
}));

const handleRequest = (
  await import(new URL("../src/entry.server.tsx", import.meta.url).href)
).default;

it("handles org server entry requests", async () => {
  const request = new Request("https://org.example", {
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });
  const responseHeaders = new Headers();
  const routerContext = { isSpaMode: false } as unknown as EntryContext;
  const loadContext = {
    security: { nonce: "abc123" },
  } as unknown as AppLoadContext;

  const response = await handleRequest(
    request,
    200,
    responseHeaders,
    routerContext,
    loadContext,
  );

  expect(renderCalls.length).toBe(1);
  expect(response).toBeInstanceOf(Response);
  expect(responseHeaders.get("Content-Type")).toBe("text/html");
  expect(responseHeaders.get("Content-Security-Policy")).toContain("nonce-abc123");
});

afterAll(() => {
  mock.module("react-dom/server", () => actualReactDomServer);
});
