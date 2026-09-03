import { createFileRoute } from '@tanstack/react-router';

import { renderAggregateHealth } from '../lib/runtime-health';

/*
 * Human-readable aggregate of the three Kubernetes probes. Server route only:
 * no component, no HTML, no JSON.
 */
export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: () => renderAggregateHealth(),
    },
  },
});
