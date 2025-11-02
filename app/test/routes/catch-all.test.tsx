import "../../test-setup.ts";

import { afterAll, describe, expect, it, mock } from "bun:test";

const { render } = await import("@testing-library/react");

const actualNotFoundModule = await import("../../src/routes/NotFoundPage");
let renderCount = 0;

mock.module("../../src/routes/NotFoundPage", () => ({
	...actualNotFoundModule,
	NotFoundPage: () => {
		renderCount += 1;
		return <div data-testid="not-found-page" />;
	},
}));

const catchAllModule = await import("../../src/routes/catch-all");
const { default: CatchAll, meta, loader, handle } = catchAllModule;

afterAll(() => {
	mock.module("../../src/routes/NotFoundPage", () => actualNotFoundModule);
});

describe("catch-all route", () => {
	it("defines handle metadata for breadcrumbs", () => {
		expect(handle.titleName).toBe("404 - ページが見つかりません");
		expect(handle.breadcrumb()).toBe("404");
	});

	it("returns SEO metadata", () => {
		expect(meta({} as never)).toEqual([
			{ title: "404 - ページが見つかりません" },
			{
				name: "description",
				content:
					"お探しのページは見つかりませんでした。URLを確認するか、ホームページから目的のページをお探しください。",
			},
			{ name: "robots", content: "noindex, nofollow" },
		]);
	});

	it("throws a 404 response from the loader", () => {
		expect(() => loader({} as never)).toThrowError(Response);
		try {
			loader({} as never);
		} catch (error) {
			const response = error as Response;
			expect(response.status).toBe(404);
			expect(response.statusText).toBe("ページが見つかりません");
		}
	});

	it("renders the not found page component", () => {
		const { getByTestId } = render(<CatchAll />);
		expect(getByTestId("not-found-page")).toBeInTheDocument();
		expect(renderCount).toBe(1);
	});
});
