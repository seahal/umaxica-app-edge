import app from '../../src/index';

export const requestFromOrgApp = (
  path: string,
  init?: RequestInit,
  env?: Record<string, unknown>,
): Response | Promise<Response> => app.request(path, init, env);
