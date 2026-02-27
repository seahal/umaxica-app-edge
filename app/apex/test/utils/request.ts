import app from '../../src/index';

export const requestFromApp = (path: string, init?: RequestInit) => app.request(path, init);
