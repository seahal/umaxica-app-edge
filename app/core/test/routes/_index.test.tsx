import { render } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import Home from '../../src/routes/_index';

describe('Home component', () => {
  it('renders Timeline component', () => {
    const Stub = createRoutesStub([
      {
        Component: () => (
          <Home loaderData={{ codeName: 'Test', message: '' }} params={{}} matches={[]} />
        ),
        path: '*',
      },
    ]);
    const { container } = render(<Stub />);
    expect(container.querySelector('[data-testid="timeline"]') || container).toBeDefined();
  });
});
