import { csrf } from 'hono/csrf';

const PRODUCTION_APEX_ORIGIN = /^https:\/\/umaxica\.(com|org|app|net)$/;
const LOCAL_APEX_ORIGIN = /^http:\/\/(com|org|app|net)\.localhost(?::\d+)?$/;
const PREVIEW_APEX_ORIGIN = /^https:\/\/[\w-]+\.[\w-]+\.workers\.dev$/;

export const isAllowedApexOrigin = (origin?: string): boolean => {
  if (!origin) {
    return false;
  }

  const allowed = (
    PRODUCTION_APEX_ORIGIN.test(origin) ||
    LOCAL_APEX_ORIGIN.test(origin) ||
    PREVIEW_APEX_ORIGIN.test(origin)
  );
  console.log(`isAllowedApexOrigin(${origin}) => ${allowed}`);
  return allowed;
};

export const apexCsrf = async (c, next) => {
  const origin = c.req.header('origin');
  const secFetchSite = c.req.header('sec-fetch-site');
  const contentType = c.req.header('content-type');
  console.log(`[apexCsrf] URL: ${c.req.url}`);
  console.log(`[apexCsrf] origin: ${origin}`);
  console.log(`[apexCsrf] sec-fetch-site: ${secFetchSite}`);
  console.log(`[apexCsrf] content-type: ${contentType}`);
  console.log(`[apexCsrf] method: ${c.req.method}`);
  
  // Call the actual CSRF middleware
  const handler = csrf({
    origin: (origin) => {
      console.log(`[csrf origin callback] ${origin}`);
      return isAllowedApexOrigin(origin);
    },
  });
  
  return handler(c, next);
};
