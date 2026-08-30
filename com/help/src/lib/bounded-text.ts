/**
 * The first `maxChars` characters of a response body, decoded as UTF-8.
 *
 * `await response.text()` followed by `.slice()` reads the WHOLE body into
 * memory before discarding all but the prefix, which is the opposite of what the
 * callers need and of what their comments used to claim: a Rails error page of
 * any size was buffered in full just to check whether its first twenty
 * characters say `ProxyError`. This decodes from the stream and stops, then
 * cancels the rest so the connection is not left open.
 *
 * `TextDecoderStream` rather than a byte reader with a `TextDecoder` after it:
 * it makes the stream `ReadableStream<string>`, which is both correctly typed
 * (`Response.body` is `ReadableStream<any>`, so a byte reader hands back
 * unchecked chunks) and correct across a multi-byte character, which a byte
 * count cut at an arbitrary offset is not.
 *
 * Shared by `rails-client.ts` and `core-dispatch.ts` because both classify the
 * same `ProxyError: <code>` body and must bound it the same way. It is the whole
 * of this module on purpose — the two callers are the only consumers, and
 * neither owns the concern more than the other.
 *
 * Pass a response the caller does not need intact, or a `clone()` of one.
 */
export async function readBoundedText(response: Response, maxChars: number): Promise<string> {
  const body = response.body;
  if (body === null) {
    return '';
  }

  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let text = '';

  try {
    while (text.length < maxChars) {
      const { done, value } = await reader.read();
      if (done) break;
      text += value;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /*
       * Cancelling is a courtesy to the connection, not part of the result, so a
       * cancel that rejects must not turn a completed read into a failure.
       * Node's `pipeThrough` swallows the upstream rejection already; workerd
       * makes no such promise, and this is the runtime that matters.
       */
    }
  }

  return text.slice(0, maxChars).trim();
}
