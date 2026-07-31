const RAILS_HOSTNAME = 'core.com.localhost';
const RAILS_PORT = 3000;
const RAILS_FETCH_TIMEOUT_MS = 1500;

export interface RailsFetcher {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

export type RailsClientResult =
  | { kind: 'ok'; status: number }
  | { kind: 'http-error'; status: number }
  | { kind: 'unreachable'; errorMessage: string }
  | { kind: 'invalid-path'; reason: string };

export interface RailsClient {
  fetch(path: string): Promise<RailsClientResult>;
}

export function getRailsClient(binding: RailsFetcher | undefined): RailsClient | null {
  if (!binding) return null;
  return {
    async fetch(path) {
      try {
        const response = await binding.fetch(
          new URL(path, `http://${RAILS_HOSTNAME}:${RAILS_PORT}/`).toString(),
          {
            redirect: 'manual',
            cache: 'no-store',
            signal: AbortSignal.timeout(RAILS_FETCH_TIMEOUT_MS),
          },
        );
        return response.ok
          ? { kind: 'ok', status: response.status }
          : { kind: 'http-error', status: response.status };
      } catch (error) {
        return {
          kind: 'unreachable',
          errorMessage: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
