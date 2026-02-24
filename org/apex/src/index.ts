import { Hono } from "hono";
import { applySecurityHeaders } from "@umaxica/shared";
import { renderAboutPage } from "./pages/about-page";
import { renderHealthPage } from "./pages/health-page";
import {
  buildRegionErrorPayload,
  getDefaultRedirectUrl,
  resolveRedirectUrl,
} from "./pages/root-redirect";

type AssetEnv = {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
};

const app = new Hono<{ Bindings: AssetEnv }>();

app.use("*", async (c, next) => {
  await next();
  applySecurityHeaders(c);
});

app.get("/", (c) => {
  const regionParam = c.req.query("ri");

  const redirectUrl = resolveRedirectUrl(regionParam);
  if (redirectUrl) {
    return c.redirect(redirectUrl, 302);
  }

  const defaultRedirectUrl = getDefaultRedirectUrl();
  if (defaultRedirectUrl) {
    return c.redirect(defaultRedirectUrl, 302);
  }

  return c.json(buildRegionErrorPayload(), 500);
});

app.get("/health", (c) => {
  return c.html(renderHealthPage(new Date().toISOString()));
});

app.get("/about", (c) => {
  return c.html(renderAboutPage());
});

app.get("/v1/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;
