import { render, screen } from '@testing-library/react';

import { default as About, loader } from '../../src/routes/about';

describe('com/core about route', () => {
  it('renders about page content', () => {
    render(<About />);

    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('loader throws intentional error for Sentry verification', () => {
    expect(() => loader()).toThrow('Intentional /about error for Sentry DSN verification');
  });
});
