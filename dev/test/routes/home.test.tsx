import { afterAll, describe, expect, it, mock } from "bun:test";
import { createElement } from "react";

const DocsViewerMock = () => createElement("mock-docs-viewer");

mock.module("../../src/components/DocsViewer", () => ({
	DocsViewer: DocsViewerMock,
}));

const homeModule = await import("../../src/routes/home");
const { default: HomeRoute, meta } = homeModule;

afterAll(async () => {
	const actual = await import("../../src/components/DocsViewer");
	mock.module("../../src/components/DocsViewer", () => actual);
});

describe("dev home route", () => {
	it("declares expected metadata", () => {
		expect(meta({})).toEqual([
			{ title: "Umaxica Developers - ドキュメント" },
			{
				name: "description",
				content: "React Aria Components のドキュメント",
			},
		]);
	});

	it("renders documentation viewer component", () => {
		const element = HomeRoute();
		expect(element.type).toBe(DocsViewerMock);
	});
});
