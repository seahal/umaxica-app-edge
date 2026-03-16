import { render, screen } from '@testing-library/react';

import { default as About } from '../../src/routes/about';

describe('app/core about route', () => {
  it('renders about page content', () => {
    render(<About />);

    expect(screen.getByText('About')).toBeInTheDocument();
  });
});
