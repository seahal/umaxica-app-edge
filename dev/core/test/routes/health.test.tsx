import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vite-plus/test';
import { render, screen } from '@testing-library/react';
import HealthPage from '../../src/app/health/page';

describe('dev/core health page', () => {
  it('renders health page with OK status', () => {
    render(<HealthPage />);

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('has edge runtime configuration', async () => {
    const pageModule = await import('../../src/app/health/page');
    expect(pageModule.config).toEqual({ runtime: 'edge' });
  });
});
