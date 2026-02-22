// Generated type file for the org index route
export namespace Route {
  export interface MetaArgs {
    data?: unknown;
    params: Record<string, string>;
    matches: unknown[];
  }

  export interface LoaderArgs {
    context: {
      cloudflare: {
        env: unknown;
        ctx: unknown;
      };
    };
    params: Record<string, string>;
    request: Request;
  }

  export interface ComponentProps {
    loaderData: {
      message: string;
    };
  }
}
