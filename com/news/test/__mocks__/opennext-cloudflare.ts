let context: { env: Record<string, unknown> } = { env: {} };
let shouldThrow = false;

export function getCloudflareContext() {
  if (shouldThrow) {
    throw new Error('cloudflare context unavailable');
  }
  return context;
}

export function setCloudflareContext(nextContext: typeof context) {
  context = nextContext;
}

export function setCloudflareContextShouldThrow(next: boolean) {
  shouldThrow = next;
}
