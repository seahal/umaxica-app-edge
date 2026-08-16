import { csrf } from 'hono/csrf';

const PRODUCTION_APEX_ORIGIN = /^https:\/\/umaxica\.(com|org|app|net)$/u;
const LOCAL_APEX_ORIGIN = /^http:\/\/(com|org|app|net)\.localhost(?::\d+)?$/u;
const PREVIEW_APEX_ORIGIN = new RegExp(
  '^https://[a-zA-Z0-9_-]+[.](com|org|app|net)-apex[.]workers[.]dev$',
  'u',
);

export const isAllowedApexOrigin = (origin?: string): boolean => {
  if (!origin) {
    return false;
  }

  return (
    PRODUCTION_APEX_ORIGIN.test(origin) ||
    LOCAL_APEX_ORIGIN.test(origin) ||
    PREVIEW_APEX_ORIGIN.test(origin)
  );
};

export const apexCsrf = csrf({
  origin: (origin) => isAllowedApexOrigin(origin),
});
