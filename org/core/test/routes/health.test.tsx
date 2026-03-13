import { loader, meta } from '../../src/routes/health';

describe('org/core health route', () => {
  it('provides the health status page title', () => {
    expect(meta()).toStrictEqual([{ title: 'Health Status | UMAXICA (org)' }]);
  });

  it('marks the response as noindex', async () => {
    const response = loader();

    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});
