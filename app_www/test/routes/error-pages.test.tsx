import "../../test-setup.ts";

import { afterAll, describe, expect, it, vi } from "vitest";

const { render } = await import("@testing-library/react");

interface ErrorPageProps {
  status: number;
  title: string;
  message: string;
  suggestion?: string;
  showNavigation?: boolean;
  showDetails?: boolean;
  details?: string;
  stack?: string;
}
let lastProps: ErrorPageProps | undefined = undefined;

vi.mock("../../src/components/ErrorPage", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    ErrorPage: (props: ErrorPageProps) => {
      lastProps = props;
      return <div data-testid="error-page">{props.title}</div>;
    },
  };
});

const { InternalServerErrorPage } = await import("../../src/routes/InternalServerErrorPage");
const { NotFoundPage } = await import("../../src/routes/NotFoundPage");

afterAll(() => {
  vi.restoreAllMocks();
});

describe("error route wrappers", () => {
  it("forwards props for internal server errors", () => {
    lastProps = undefined as ErrorPageProps | undefined;
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
    lastProps = undefined as ErrorPageProps | undefined;
    const { getByTestId } = render(<NotFoundPage />);

    expect(getByTestId("error-page")).toHaveTextContent("ページが見つかりません");
    expect(lastProps?.status).toBe(404);
    expect(lastProps?.showNavigation).toBe(true);
  });
});
