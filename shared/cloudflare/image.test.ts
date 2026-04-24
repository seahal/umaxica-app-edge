import { describe, expect, it } from 'vite-plus/test';
import { validateImageUrl } from './image';

describe('shared/cloudflare/image', () => {
  it('resolves relative urls against the request url', () => {
    expect(validateImageUrl('/logo.png', 'https://example.com/app')).toBe(
      'https://example.com/logo.png',
    );
  });

  it('allows same-origin absolute urls', () => {
    expect(validateImageUrl('https://example.com/logo.png', 'https://example.com/app')).toBe(
      'https://example.com/logo.png',
    );
  });

  it('allows explicitly configured hostnames', () => {
    expect(
      validateImageUrl(
        'https://images.unsplash.com/photo-1.jpg',
        'https://example.com/app',
        'images.unsplash.com, avatars.githubusercontent.com',
      ),
    ).toBe('https://images.unsplash.com/photo-1.jpg');
  });

  it('rejects disallowed hostnames', () => {
    expect(
      validateImageUrl('https://evil.example/image.png', 'https://example.com/app'),
    ).toBeNull();
  });

  it('rejects non-http schemes', () => {
    expect(validateImageUrl('data:image/png;base64,abc', 'https://example.com/app')).toBeNull();
  });

  it('rejects embedded credentials', () => {
    expect(
      validateImageUrl('https://user:pass@example.com/logo.png', 'https://example.com/app'),
    ).toBeNull();
  });
});
