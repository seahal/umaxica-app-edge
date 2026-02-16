import { Hono } from "hono";
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

// Security headers middleware
app.use("*", async (c, next) => {
  await next();
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests",
  );
  c.header(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  );
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-XSS-Protection", "1; mode=block");
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
