import { describe, expect, it } from 'vite-plus/test';
import { GET } from '../../src/app/health/route';

describe('dev/core health route', () => {
  it('returns OK with status 200', async () => {
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain');
    expect(text).toBe('OK');
  });
});
