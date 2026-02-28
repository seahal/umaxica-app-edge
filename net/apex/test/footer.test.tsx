import { Footer } from '../src/footer';

describe('Footer component', () => {
  it('renders copyright with current UTC year', () => {
    const html = (<Footer />).toString();
    const currentYear = new Date().getUTCFullYear();
    expect(html).toContain(`© ${currentYear} UMAXICA`);
  });

  it('renders a footer element', () => {
    const html = (<Footer />).toString();
    expect(html).toContain('<footer');
    expect(html).toContain('</footer>');
  });

  it('applies expected CSS classes', () => {
    const html = (<Footer />).toString();
    expect(html).toContain('bg-white');
    expect(html).toContain('border-t');
    expect(html).toContain('text-center');
  });
});
