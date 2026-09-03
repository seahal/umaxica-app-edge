import type { APIRoute } from 'astro';

import { renderAggregateHealth } from '../lib/runtime-health';

/*
 * Human-readable aggregate of the three Kubernetes probes. On-demand so a
 * static `ok` file is never treated as a live Worker.
 */
export const prerender = false;

export const GET: APIRoute = () => renderAggregateHealth();
