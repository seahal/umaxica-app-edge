import { renderHealthPage } from './health-page';

describe('health-page', () => {
  const mockEnv = {
    BRAND_NAME: 'TestBrand',
    CF_BEACON: 'test',
  };

  it('renders health page with OK status', () => {
    const response = renderHealthPage(mockEnv as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('includes brand name in the page', async () => {
    const response = renderHealthPage(mockEnv as never);
    const body = await response.text();

    expect(body).toContain('TestBrand');
    expect(body).toContain('<strong>Status:</strong> OK');
  });

  it('includes timestamp in the page', async () => {
    const response = renderHealthPage(mockEnv as never);
    const body = await response.text();

    expect(body).toContain('Timestamp:');
  });

  it('returns proper HTML structure', async () => {
    const response = renderHealthPage(mockEnv as never);
    const body = await response.text();

    expect(body).toContain('<!doctype html>');
    expect(body).toContain('<html lang="ja">');
    expect(body).toContain('</html>');
  });
});
