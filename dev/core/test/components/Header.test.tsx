import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vite-plus/test';
import { createRoutesStub } from 'react-router';
import { Header } from '../../src/components/Header';

function renderHeader(props: Partial<Parameters<typeof Header>[0]> = {}, initialPath = '/') {
  const Stub = createRoutesStub([
    {
      Component: () => <Header {...(props as Parameters<typeof Header>[0])} />,
      path: '*',
    },
  ]);
  return render(<Stub initialEntries={[initialPath]} />);
}

describe('Header component', () => {
  it('renders branding with fallback code name', () => {
    renderHeader();

    expect(screen.getByText('Umaxica', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByTitle('Umaxica')).toBeInTheDocument();
  });

  it('renders custom code name when provided', () => {
    renderHeader({ codeName: 'DevApp' });

    expect(screen.getAllByText('DevApp').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('DevApp').length).toBeGreaterThan(0);
  });

  it('renders all navigation links', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: '💬' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '🔔' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '⚙️' })).toBeInTheDocument();
  });

  it('renders Explore and Login buttons', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: /Explore/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Login/ })).toBeInTheDocument();
  });

  it('renders external service links when URLs provided', () => {
    renderHeader({
      docsServiceUrl: 'docs.umaxica.app',
      helpServiceUrl: 'help.umaxica.app',
      newsServiceUrl: 'news.umaxica.app',
    });

    expect(screen.getByRole('link', { name: '📰' })).toHaveAttribute(
      'href',
      'https://news.umaxica.app',
    );
    expect(screen.getByRole('link', { name: '📚' })).toHaveAttribute(
      'href',
      'https://docs.umaxica.app',
    );
    expect(screen.getByRole('link', { name: '❓' })).toHaveAttribute(
      'href',
      'https://help.umaxica.app',
    );
  });

  it('does not render external links when URLs are not provided', () => {
    renderHeader();

    expect(screen.queryByRole('link', { name: '📰' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '📚' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '❓' })).not.toBeInTheDocument();
  });

  it('applies active styles to message link when active', () => {
    renderHeader({}, '/message');

    const messageLink = screen.getByRole('link', { name: '💬' });
    expect(messageLink.className).toContain('scale-110');
  });

  it('applies active styles to explore link when active', () => {
    renderHeader({}, '/explore');

    const exploreLink = screen.getByRole('link', { name: /Explore/ });
    expect(exploreLink.className).toContain('bg-blue-600');
  });

  it('renders external links with target blank and noopener', () => {
    renderHeader({ newsServiceUrl: 'news.umaxica.app' });

    const newsLink = screen.getByRole('link', { name: '📰' });
    expect(newsLink).toHaveAttribute('target', '_blank');
    expect(newsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
