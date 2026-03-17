import { getNonce, readEnv } from '../src/context';

describe('getNonce', () => {
  it('returns existing nonce from security context', () => {
    const context = {
      security: { nonce: 'existing-nonce' },
    };

    const result = getNonce(context);

    expect(result).toBe('existing-nonce');
  });

  it('generates new nonce and sets it via provider', () => {
    let storedContext: Record<string, unknown> = {};
    const provider = {
      get: () => undefined,
      set: (_ctx: unknown, value: Record<string, unknown>) => {
        storedContext = value;
      },
    };

    const result = getNonce(provider);

    expect(result).not.toBeUndefined();
    expect(result.length).toBeGreaterThan(0);
    expect((storedContext.security as { nonce?: string })?.nonce).toBe(result);
  });

  it('generates nonce and sets on mutable context object', () => {
    const context: Record<string, unknown> = {};

    const result = getNonce(context);

    expect(result).not.toBeUndefined();
    expect((context.security as Record<string, string>)?.nonce).toBe(result);
  });

  it('generates a nonce even when context is undefined', () => {
    const result = getNonce(undefined);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('readEnv', () => {
  it('reads from runtime context first', () => {
    const context = {
      runtime: {
        env: {
          MY_KEY: 'context-value',
        },
      },
    };

    const result = readEnv(context, 'MY_KEY');

    expect(result).toBe('context-value');
  });

  it('falls back to global process.env', () => {
    const context = {};
    const originalEnv = globalThis.process?.env;

    (globalThis as { process?: { env?: Record<string, string> } }).process = {
      env: { MY_KEY: 'process-value' },
    };

    const result = readEnv(context, 'MY_KEY');

    expect(result).toBe('process-value');

    if (originalEnv) {
      (globalThis as { process?: { env?: Record<string, string> } }).process = {
        env: originalEnv as Record<string, string>,
      };
    }
  });

  it('falls back to import.meta.env', () => {
    const context = {};

    const result = readEnv(context, 'NON_EXISTENT_KEY', 'default-value');

    expect(result).toBe('default-value');
  });

  it('reads VITE-prefixed values from process.env', () => {
    const context = {};
    const originalEnv = globalThis.process?.env;

    (globalThis as { process?: { env?: Record<string, string> } }).process = {
      env: { VITE_MY_KEY: 'prefixed-process-value' },
    };

    const result = readEnv(context, 'MY_KEY');

    expect(result).toBe('prefixed-process-value');

    if (originalEnv) {
      (globalThis as { process?: { env?: Record<string, string> } }).process = {
        env: originalEnv as Record<string, string>,
      };
      return;
    }

    delete (globalThis as { process?: { env?: Record<string, string> } }).process;
  });

  it('trims fallback values before returning them', () => {
    expect(readEnv({}, 'NON_EXISTENT_KEY', '  default-value  ')).toBe('default-value');
  });
});
