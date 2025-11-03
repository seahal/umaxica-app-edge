import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const { DocsViewer } = await import("../../src/components/DocsViewer");

describe("dev DocsViewer component", () => {
	it("renders documentation sidebar with all sections", () => {
		const markup = renderToStaticMarkup(<DocsViewer />);

		expect(markup).toContain("ドキュメント");
		expect(markup).toContain("Button コンポーネント");
		expect(markup).toContain("Tabs コンポーネント");
		expect(markup).toContain("Dialog コンポーネント");
	});

	it("displays content and code tabs for the selected section", () => {
		const markup = renderToStaticMarkup(<DocsViewer />);

		expect(markup).toContain("説明");
		expect(markup).toContain("コード例");
		expect(markup).toContain("React Aria Components へようこそ");
	});
});
