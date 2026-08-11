let context: { env: Record<string, unknown> } = { env: {} };

export function getCloudflareContext() {
  return context;
}

export function setCloudflareContext(nextContext: typeof context) {
  context = nextContext;
}
