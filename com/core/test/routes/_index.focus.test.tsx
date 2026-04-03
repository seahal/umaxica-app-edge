import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

type AnchorProps = ComponentPropsWithoutRef<'a'>;
type ButtonProps = ComponentPropsWithoutRef<'button'>;
type DivProps = ComponentPropsWithoutRef<'div'>;
type InputProps = ComponentPropsWithoutRef<'input'>;
type LabelProps = ComponentPropsWithoutRef<'label'>;

vi.mock('react-aria-components', async (importOriginal) => {
  const actual = await (importOriginal as () => Promise<Record<string, unknown>>)();

  return {
    ...actual,
    Button: ({ children, ...props }: ButtonProps) => <button {...props}>{children}</button>,
    Input: (props: InputProps) => <input {...props} />,
    Label: ({ children, ...props }: LabelProps) => <label {...props}>{children}</label>,
    Link: ({ children, ...props }: AnchorProps) => <a {...props}>{children}</a>,
    Tab: ({
      children,
      className,
      ...props
    }: {
      children: ReactNode;
      className?: string | ((state: { isFocusVisible: boolean; isSelected: boolean }) => string);
      [key: string]: unknown;
    }) => (
      <button
        data-class={
          typeof className === 'function'
            ? className({ isFocusVisible: true, isSelected: false })
            : className
        }
        {...props}
      >
        {children}
      </button>
    ),
    TabList: ({ children, ...props }: DivProps) => <div {...props}>{children}</div>,
    TabPanel: ({ children, ...props }: DivProps) => <div {...props}>{children}</div>,
    Tabs: ({ children, ...props }: DivProps) => <div {...props}>{children}</div>,
    TextField: ({ children, ...props }: DivProps) => <div {...props}>{children}</div>,
  };
});

const { default: Home } = await import('../../src/routes/_index');

const homeLoaderData = { codeName: 'Umaxica', message: 'Hello' };

describe('Route: Home (com) focus-visible styling', () => {
  it('adds focus-visible styles to perspective tabs', () => {
    const markup = renderToStaticMarkup(<Home loaderData={homeLoaderData} />);

    expect(markup).toContain('ring-2 ring-offset-2 ring-blue-400');
  });
});
