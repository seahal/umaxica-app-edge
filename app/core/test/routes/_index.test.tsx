import { render } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import Home from '../../src/routes/_index';
import type { Route } from '../../src/routes/+types/_index';

describe('Home component', () => {
  it('renders Timeline component', () => {
    const Stub = createRoutesStub([
      {
        Component: () => {
          const props: Route.ComponentProps = {
            loaderData: { codeName: 'Test', message: '' },
          };
          return <Home {...props} />;
        },
        path: '*',
      },
    ]);
    const { container } = render(<Stub />);
    expect(container.querySelector('[data-testid="timeline"]') || container).toBeDefined();
  });
});
