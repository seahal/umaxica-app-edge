import { render, screen } from '@testing-library/react';

import { default as SentryTest } from '../../src/routes/sentry';

describe('com/core sentry route', () => {
  it('renders sentry test page content', () => {
    render(<SentryTest />);

    expect(screen.getByText('Sentry Test')).toBeInTheDocument();
  });
});
