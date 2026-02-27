/* eslint-disable import/no-relative-parent-imports */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
import '../../test-setup.ts';

const HTTP_STATUS_500 = 500;
const HTTP_STATUS_404 = 404;

const { render } = await import('@testing-library/react');

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
let lastProps: ErrorPageProps | undefined;

vi.mock(import('../../src/components/ErrorPage'), async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    ErrorPage: (props: ErrorPageProps): JSX.Element => {
      lastProps = props;
      return <div data-testid="error-page">{props.title}</div>;
    },
  };
});

const { InternalServerErrorPage } = await import('../../src/routes/InternalServerErrorPage');
const { NotFoundPage } = await import('../../src/routes/NotFoundPage');

afterAll(() => {
  vi.restoreAllMocks();
});

describe('error route wrappers', () => {
  it('forwards props for internal server errors', () => {
    lastProps = undefined;
    const { getByTestId } = render(
      <InternalServerErrorPage details="details" stack="stack" showDetails />,
    );

    expect(getByTestId('error-page')).toHaveTextContent('サーバーエラー');
    expect(lastProps?.status).toBe(HTTP_STATUS_500);
    expect(lastProps?.showDetails).toBeTruthy();
    expect(lastProps?.details).toBe('details');
    expect(lastProps?.stack).toBe('stack');
  });

  it('renders a not found page', () => {
    lastProps = undefined;
    const { getByTestId } = render(<NotFoundPage />);

    expect(getByTestId('error-page')).toHaveTextContent('ページが見つかりません');
    expect(lastProps?.status).toBe(HTTP_STATUS_404);
    expect(lastProps?.showNavigation).toBeTruthy();
  });
});
