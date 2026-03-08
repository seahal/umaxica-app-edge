import app from '../../src/index';

export const requestFromApp = (path: string, init?: RequestInit): Response | Promise<Response> =>
  app.request(path, init);
