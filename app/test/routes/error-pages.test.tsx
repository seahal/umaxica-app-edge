import "../../test-setup.ts";

import { afterAll, describe, expect, it, mock } from "bun:test";

const { render } = await import("@testing-library/react");

const actualErrorComponent = await import("../../src/components/ErrorPage");

type CapturedProps = Parameters<typeof actualErrorComponent.ErrorPage>[0];
let lastProps: CapturedProps | undefined;

mock.module("../../src/components/ErrorPage", () => ({
	...actualErrorComponent,
	ErrorPage: (props: CapturedProps) => {
		lastProps = props;
		return <div data-testid="error-page">{props.title}</div>;
	},
}));

const { InternalServerErrorPage } = await import(
	"../../src/routes/InternalServerErrorPage"
);
const { NotFoundPage } = await import("../../src/routes/NotFoundPage");

afterAll(() => {
	mock.module("../../src/components/ErrorPage", () => actualErrorComponent);
});

describe("error route wrappers", () => {
	it("forwards props for internal server errors", () => {
		lastProps = undefined;
		const { getByTestId } = render(
			<InternalServerErrorPage details="details" stack="stack" showDetails />,
		);

		expect(getByTestId("error-page")).toHaveTextContent("サーバーエラー");
		expect(lastProps?.status).toBe(500);
		expect(lastProps?.showDetails).toBe(true);
		expect(lastProps?.details).toBe("details");
		expect(lastProps?.stack).toBe("stack");
	});

	it("renders a not found page", () => {
		lastProps = undefined;
		const { getByTestId } = render(<NotFoundPage />);

		expect(getByTestId("error-page")).toHaveTextContent(
			"ページが見つかりません",
		);
		expect(lastProps?.status).toBe(404);
		expect(lastProps?.showNavigation).toBe(true);
	});
});
