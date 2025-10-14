import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";

import App, { Layout, loader, meta } from "../app/src/root";

describe("root meta", () => {
	it("provides a default empty title", () => {
		expect(meta({} as never)).toStrictEqual([{ title: "" }]);
	});
});

describe("Layout component", () => {
	it("wraps children with an html document structure", () => {
		const child = <div data-testid="content">Main content</div>;
		const element = Layout({ children: child });

		expect(element.type).toBe("html");
		expect(element.props.lang).toBe("ja");

		const [head, body] = element.props.children as [ReactElement, ReactElement];
		expect(head.type).toBe("head");
		expect(body.type).toBe("body");

		const rawBodyChildren = body.props.children as ReactNode | ReactNode[];
		const bodyChildren = Array.isArray(rawBodyChildren)
			? rawBodyChildren
			: [rawBodyChildren];
		expect(bodyChildren[0]).toBe(child);
		expect(bodyChildren.slice(1).every(Boolean)).toBe(true);
	});
});

describe("loader", () => {
	it("extracts services from Cloudflare bindings", async () => {
		const result = await loader({
			context: {
				cloudflare: {
					env: {
						CODE_NAME: "Umaxica",
						HELP_SERVICE_URL: "help.example.com",
						DOCS_SERVICE_URL: "docs.example.com",
						NEWS_SERVICE_URL: "news.example.com",
						API_SERVICE_URL: "api.example.com",
						APEX_SERVICE_URL: "apex.example.com",
						EDGE_SERVICE_URL: "edge.example.com",
					},
				},
				security: { nonce: "nonce-value" },
			},
		} as never);

		expect(result).toStrictEqual({
			codeName: "Umaxica",
			helpServiceUrl: "help.example.com",
			docsServiceUrl: "docs.example.com",
			newsServiceUrl: "news.example.com",
			apiServiceUrl: "api.example.com",
			apexServiceUrl: "apex.example.com",
			edgeServiceUrl: "edge.example.com",
			cspNonce: "nonce-value",
		});
	});

	it("falls back to empty strings when bindings are missing", async () => {
		const result = await loader({ context: {} } as never);

		expect(result).toStrictEqual({
			codeName: "",
			helpServiceUrl: "",
			docsServiceUrl: "",
			newsServiceUrl: "",
			apiServiceUrl: "",
			apexServiceUrl: "",
			edgeServiceUrl: "",
			cspNonce: "",
		});
	});
});
