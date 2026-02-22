import app from "../../src/index";

export const requestFromComApp = (path: string, init?: RequestInit) => {
  return app.request(path, init);
};
