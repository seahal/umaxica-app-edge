import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({ Inter: () => ({ variable: 'font-sans' }) }));

import Layout, { metadata } from '../src/app/layout';
import Page from '../src/app/page';

describe('com/news application shell', () => {
  it('renders the public page and matching metadata', () => {
    expect(
      renderToStaticMarkup(
        <Layout>
          <Page />
        </Layout>,
      ),
    ).toContain('UMAXICA News');
    expect(metadata.title).toEqual({
      default: 'News — UMAXICA (COM)',
      template: '%s — UMAXICA (COM)',
    });
  });
});
