import { describe, expect, it } from 'vitest';

import { readBoundedText } from '../../src/lib/bounded-text';

/*
 * The bound itself.
 *
 * `rails-client.ts` and `core-dispatch.ts` are the only callers, and both reach
 * this helper with the same short `ProxyError: <code>` line — so the two
 * properties the module exists for were never asserted: that a long body is NOT
 * read to the end, and that a stream refusing to cancel still yields its prefix
 * rather than rejecting. Neither is a statement about a response, so neither
 * belongs in `api/`; both are about what this code does to a stream.
 */

/** A stream that repeats `chunk` forever and counts how often it was pulled. */
function endlessResponse(chunk: string) {
  const counter = { pulls: 0 };
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      counter.pulls += 1;
      controller.enqueue(new TextEncoder().encode(chunk));
    },
  });
  return { counter, response: new Response(stream) };
}

describe('readBoundedText', () => {
  it('returns the whole body when it is shorter than the bound, trimmed', async () => {
    await expect(readBoundedText(new Response('  ProxyError: 502\n'), 100)).resolves.toBe(
      'ProxyError: 502',
    );
  });

  it('stops at the bound instead of draining the body', async () => {
    const { counter, response } = endlessResponse('0123456789');

    /*
     * This stream never ends, so returning at all is the assertion. The
     * `await response.text()` this module replaced would still be reading.
     */
    await expect(readBoundedText(response, 25)).resolves.toBe('0123456789012345678901234');
    expect(counter.pulls).toBeLessThan(10);
  });

  it('decodes across a chunk boundary rather than cutting a character in half', async () => {
    const bytes = new TextEncoder().encode('日本語のテキスト');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Split inside the first character: one of its three bytes arrives in
        // this chunk and the other two in the next. A byte reader with a
        // `TextDecoder` after it is what this would catch.
        controller.enqueue(bytes.slice(0, 1));
        controller.enqueue(bytes.slice(1));
        controller.close();
      },
    });

    await expect(readBoundedText(new Response(stream), 3)).resolves.toBe('日本語');
  });

  it('answers empty for a response carrying no body at all', async () => {
    // A 204 arrives here with `body === null`, and the callers classify the
    // text either way rather than branching on the status a second time.
    await expect(readBoundedText(new Response(null, { status: 204 }), 20)).resolves.toBe('');
  });

  it('still returns the prefix when the stream refuses to be cancelled', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('ProxyError: 502'));
      },
      cancel() {
        throw new Error('this stream cannot be cancelled');
      },
    });

    // Cancelling is a courtesy to the connection, not part of the result: a
    // throwing cancel must not turn a completed read into a rejected promise.
    await expect(readBoundedText(new Response(stream), 10)).resolves.toBe('ProxyError');
  });
});
