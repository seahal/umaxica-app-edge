import { createFileRoute } from '@tanstack/react-router';

import { getEdgeEnv } from '../lib/cloudflare-env';

export const Route = createFileRoute('/revision')({
  server: {
    handlers: {
      GET: () => {
        let revision: { id: string | null; tag: string | null; timestamp: string | null } = {
          id: null,
          tag: null,
          timestamp: null,
        };

        try {
          const { id = null, tag = null, timestamp = null } = getEdgeEnv().REVISION ?? {};
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
      },
    },
  },
});
