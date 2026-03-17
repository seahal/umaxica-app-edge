// Minimal local type stub for catch-all route
export namespace Route {
  export interface MetaArgs {
    data?: unknown;
    params: Record<string, string>;
    matches: unknown[];
  }

  export interface LoaderArgs {
    params: Record<string, string>;
    request: Request;
  }
}
