import '../../test-setup.ts';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloudflareContext } from '../../src/context';
import Explore, { loader } from '../../src/routes/explore/_index';

function createMockContext(env: Record<string, unknown>) {
  const contextMap = new Map<unknown, unknown>([
    [
      CloudflareContext,
      {
        cloudflare: { env },
      },
    ],
  ]);

  return {
    get: (key: unknown) => contextMap.get(key),
  };
}

describe('Explore route (com)', () => {
  it('uses the fallback helper message when env is missing the Cloudflare value', () => {
    const result = loader({ context: createMockContext({}) } as never);

    expect(result).toStrictEqual({
      message: 'Calm automation signals are healthy.',
    });
  });

  it('renders explore page title', () => {
    render(<Explore loaderData={{ message: 'test message' }} params={{}} matches={[]} />);

    expect(
      screen.getByText('Umaxica を横断検索し、静かなシグナルをすぐに捉える'),
    ).toBeInTheDocument();
    expect(screen.getByText('test message')).toBeInTheDocument();
  });

  it('filters results based on query', async () => {
    const user = userEvent.setup();
    render(<Explore loaderData={{ message: '' }} params={{}} matches={[]} />);

    const input = screen.getByPlaceholderText('例: onboarding, account liaison, latency');
    await user.type(input, 'Atlas');

    expect(screen.getByText('Atlas Console')).toBeInTheDocument();
    expect(screen.queryByText('Edge Discovery Kit')).not.toBeInTheDocument();
  });

  it('clears the query and restores the full result list', async () => {
    const user = userEvent.setup();
    render(<Explore loaderData={{ message: '' }} params={{}} matches={[]} />);

    const input = screen.getByPlaceholderText('例: onboarding, account liaison, latency');
    await user.type(input, 'Atlas');
    expect(screen.getAllByRole('article')).toHaveLength(1);

    await user.click(screen.getByText('クリア'));

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: 'クリア' })).toBeNull();
    expect(input).toHaveValue('');
  });

  it('filters results based on tags/categories', async () => {
    const user = userEvent.setup();
    render(<Explore loaderData={{ message: '' }} params={{}} matches={[]} />);

    const productsTag = screen.getByRole('gridcell', { name: 'プロダクト' });
    await user.click(productsTag);

    expect(screen.getByText('Atlas Console')).toBeInTheDocument();
    expect(screen.queryByText('Client Liaison Squad')).not.toBeInTheDocument();
  });

  it('combines category and query filtering', async () => {
    const user = userEvent.setup();
    render(<Explore loaderData={{ message: '' }} params={{}} matches={[]} />);

    await user.click(screen.getByRole('gridcell', { name: 'シグナル' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('Latency Pulse')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('例: onboarding, account liaison, latency');
    await user.type(input, 'Atlas');

    expect(screen.queryByText('Latency Pulse')).toBeNull();
    expect(screen.getByText(/検索条件に一致する結果が見つかりません/)).toBeInTheDocument();
  });

  it('shows no results message when no matches found', async () => {
    const _user = userEvent.setup();
    render(<Explore loaderData={{ message: '' }} params={{}} matches={[]} />);

    const input = screen.getByPlaceholderText('例: onboarding, account liaison, latency');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { value: 'NONEXISTENT_QUERY' } });

    expect(screen.getByText(/検索条件に一致する結果が見つかりません/)).toBeInTheDocument();
  });
});
