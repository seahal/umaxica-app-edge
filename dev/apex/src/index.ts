import { Hono, type Context } from "hono";
import { renderAboutPage } from "./pages/about-page";
import { renderHealthPage } from "./pages/health-page";
import {
  buildRegionErrorPayload,
  getDefaultRedirectUrl,
  resolveRedirectUrl,
} from "./pages/root-redirect";

const DEFAULT_CSP_STYLE_SRC = "'self' https:";

function buildCspHeader(styleSrc: string = DEFAULT_CSP_STYLE_SRC): string {
  return `default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src ${styleSrc}; style-src-attr 'none'; upgrade-insecure-requests`;
}

function applySecurityHeaders(c: Context): void {
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  c.header("Content-Security-Policy", buildCspHeader());
  c.header(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  );
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
}

type AssetEnv = {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
};

type AppBindings = AssetEnv;

const app = new Hono<{ Bindings: AppBindings }>();

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
