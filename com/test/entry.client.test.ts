import { afterAll, expect, it, mock } from "bun:test";

const hydrateCalls: unknown[][] = [];
const originalDocument = globalThis.document as Document | undefined;

if (!originalDocument) {
	(globalThis as { document?: Document }).document = {
		nodeType: 9,
	} as unknown as Document;
}
const actualReactDomClient = await import("react-dom/client");
const actualReactRouterDom = await import("react-router/dom");

mock.module("react-dom/client", () => ({
	...actualReactDomClient,
	hydrateRoot: (...args: unknown[]) => {
		hydrateCalls.push(args);
	},
}));

mock.module("react-router/dom", () => ({
	...actualReactRouterDom,
	HydratedRouter: () => null,
}));

await import(new URL("../src/entry.client.tsx", import.meta.url).href);

it("hydrates the com client entry without throwing", () => {
	expect(hydrateCalls.length).toBe(1);
	expect(hydrateCalls[0]?.[0]).toBe(document);
});

afterAll(() => {
	mock.module("react-dom/client", () => actualReactDomClient);
	mock.module("react-router/dom", () => actualReactRouterDom);

	if (originalDocument) {
		globalThis.document = originalDocument;
	} else {
		delete (globalThis as { document?: Document }).document;
	}
});
