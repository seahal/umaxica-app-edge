import '../../test-setup.ts';

import { render, screen } from '@testing-library/react';
import Healths from '../../src/routes/healths/_index';

describe('Healths route', () => {
  it('renders health status', () => {
    render(<Healths loaderData={{ message: '' }} params={{}} matches={[]} />);

    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('accepts loader data', () => {
    render(<Healths loaderData={{ message: 'test' }} params={{}} matches={[]} />);

    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
