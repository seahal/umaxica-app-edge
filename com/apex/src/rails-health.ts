import type { RailsClient } from './rails-client';

const RAILS_HEALTH_PATH = '/health/liveness.json';

export type RailsHealthResult =
  | { kind: 'ok'; status: number }
  | { kind: 'http-error'; status: number }
  | { kind: 'unreachable'; errorMessage: string }
  | { kind: 'not-configured' };

export async function checkRailsHealth(client: RailsClient | null): Promise<RailsHealthResult> {
  if (!client) return { kind: 'not-configured' };
  return client.fetch(RAILS_HEALTH_PATH);
}
