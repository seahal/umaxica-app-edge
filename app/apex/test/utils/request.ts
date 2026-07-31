import app from '../../src/index';

const defaultEnv = {
  UMAXICA_APPS_EDGE_CF_WORKERS_VPC: {
    fetch: async () => new Response(null, { status: 204 }),
  },
};

export const requestFromApp = (
  path: string,
  init?: RequestInit,
  env?: Record<string, unknown>,
): Response | Promise<Response> => app.request(path, init, { ...defaultEnv, ...env });
