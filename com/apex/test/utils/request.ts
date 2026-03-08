import app from '../../src/index';

export const requestFromComApp = (path: string, init?: RequestInit): Response | Promise<Response> =>
  app.request(path, init);
