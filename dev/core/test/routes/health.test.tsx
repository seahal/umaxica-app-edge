import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vite-plus/test';
import { render, screen } from '@testing-library/react';
import HealthPage from '../../src/app/health/page';

describe('dev/core health page', () => {
  it('renders health page with OK status', () => {
    render(<HealthPage />);

    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
