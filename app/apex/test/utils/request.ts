import app from "../../src/index";

export const requestFromApp = (path: string, init?: RequestInit) => {
  return app.request(path, init);
};
