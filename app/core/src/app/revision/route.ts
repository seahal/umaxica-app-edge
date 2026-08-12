import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

export function GET() {
  let revision: { id: string | null; tag: string | null; timestamp: string | null } = {
    id: null,
    tag: null,
    timestamp: null,
  };

  try {
    const context = getCloudflareContext() as { env?: CloudflareEnv };
    const { id = null, tag = null, timestamp = null } = context.env?.REVISION ?? {};
    revision = { id, tag, timestamp };
  } catch {
    // Version metadata only exists in the Workers runtime.
  }

  return Response.json(revision, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
