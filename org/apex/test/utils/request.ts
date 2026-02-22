import app from "../../src/index";

export const requestFromOrgApp = (path: string, init?: RequestInit) => {
  return app.request(path, init);
};
