import { render, screen } from '@testing-library/react';

import { default as SentryTest, loader } from '../../src/routes/sentry';

describe('org/core sentry route', () => {
  it('renders sentry test page content', () => {
    render(<SentryTest />);

    expect(screen.getByText('Sentry Test')).toBeInTheDocument();
  });

  it('loader throws error for Sentry testing', () => {
    expect(() => loader()).toThrow('My first Sentry error!');
  });
});
