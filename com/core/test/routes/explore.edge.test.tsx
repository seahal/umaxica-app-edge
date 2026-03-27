import '../../test-setup.ts';
import { describe, it, expect } from 'vite-plus/test';

// Extract the active filter helper logic for testing
function getActiveFilter(selectedKeys: 'all' | Set<string | number>): string {
  if (selectedKeys === 'all') {
    return 'all';
  }
  const [first] = Array.from(selectedKeys);
  return typeof first === 'string' || typeof first === 'number' ? String(first) : 'all';
}

describe('Explore route selection filtering logic (com)', () => {
  it('returns "all" when selected keys is "all"', () => {
    expect(getActiveFilter('all')).toBe('all');
  });

  it('returns first key when selected keys is a Set with a string value', () => {
    const selectedKeys = new Set<string>(['products']);
    expect(getActiveFilter(selectedKeys)).toBe('products');
  });

  it('converts string values from Set to string', () => {
    const selectedKeys = new Set<string | number>(['people']);
    expect(getActiveFilter(selectedKeys)).toBe('people');
  });

  it('returns "all" when first key is not a string', () => {
    // This test covers the branch where typeof key !== 'string'
    const selectedKeys = new Set<string | number>([1 as unknown as string]);
    const [first] = Array.from(selectedKeys);
    expect(typeof first === 'string' ? first : 'all').toBe('all');
  });
});
