import { loader } from '../../src/routes/health';

describe('dev/status health route', () => {
  it('marks the response as noindex', () => {
    const response = loader();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});
