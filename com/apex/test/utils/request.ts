import app from '../../src/index';

export const requestFromComApp = (path: string, init?: RequestInit) => app.request(path, init);
