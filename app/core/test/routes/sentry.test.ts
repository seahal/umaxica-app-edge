import { loader } from '../../src/routes/sentry';
import { describe, expect, it } from 'vite-plus/test';

describe('sentry route loader', () => {
  it('throws an error when invoked', () => {
    expect(() => loader()).toThrow('My first Sentry error!');
  });
});
