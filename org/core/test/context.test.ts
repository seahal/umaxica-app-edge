/// <reference types="vitest" />
import { getEnv, getNonce } from '../src/context';

interface MockEnv {
  TEST: string;
  [key: string]: string | undefined;
}

describe('context', () => {
  describe('getEnv', () => {
    it('returns env when CloudflareContext is available', () => {
      const mockEnv = { TEST: 'value' } as unknown as MockEnv;
      const mockProvider = {
        get: () => ({
          cloudflare: { env: mockEnv },
        }),
      };

      const result = getEnv(mockProvider);
      expect(result).toBe(mockEnv);
    });

    it('throws error when CloudflareContext is not available', () => {
      const mockProvider = {
        get: () => undefined,
      };

      expect(() => getEnv(mockProvider)).toThrow('Cloudflare environment is not available');
    });

    it('throws error when cloudflare env is undefined', () => {
      const mockProvider = {
        get: () => ({
          cloudflare: {},
        }),
      };

      expect(() => getEnv(mockProvider)).toThrow('Cloudflare environment is not available');
    });
  });

  describe('getNonce', () => {
    it('returns nonce when security context is available', () => {
      const mockNonce = 'test-nonce-123';
      const mockProvider = {
        get: () => ({
          security: { nonce: mockNonce },
        }),
      };

      const result = getNonce(mockProvider);
      expect(result).toBe(mockNonce);
    });

    it('returns empty string when security context is missing', () => {
      const mockProvider = {
        get: () => undefined,
      };

      const result = getNonce(mockProvider);
      expect(result).toBe('');
    });

    it('returns empty string when nonce is undefined', () => {
      const mockProvider = {
        get: () => ({
          security: {},
        }),
      };

      const result = getNonce(mockProvider);
      expect(result).toBe('');
    });
  });
});
