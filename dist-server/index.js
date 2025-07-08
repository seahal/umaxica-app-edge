import { jsxs, jsx } from 'hono/jsx/jsx-runtime';
import { Hono } from 'hono';
import { showRoutes } from 'hono/dev';
import { jsxRenderer } from 'hono/jsx-renderer';
import { createMiddleware } from 'hono/factory';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { timeout } from 'hono/timeout';
import { Style } from 'hono/css';

const routingMiddleware = createMiddleware(async (c, next) => {
  const hostname = c.req.header("host") || "";
  let path = c.req.path;
  console.log(`Original hostname: ${hostname}, path: ${path}`);
  if (hostname.includes("app.localhost")) {
    path = `/app${path}`;
  } else if (hostname.includes("com.localhost")) {
    path = `/com${path}`;
  } else if (hostname.includes("org.localhost")) {
    path = `/org${path}`;
  } else if (hostname.includes("umaxica.app")) {
    path = `/app${path}`;
  } else if (hostname.includes("umaxica.com")) {
    path = `/com${path}`;
  } else if (hostname.includes("umaxica.org")) {
    path = `/org${path}`;
  }
  console.log(`Rewritten path: ${path}`);
  const url = new URL(c.req.url);
  url.pathname = path;
  c.req.raw = new Request(url.toString(), c.req.raw);
  await next();
});
const middleware = [
  logger(),
  csrf(),
  cors(),
  secureHeaders(),
  prettyJSON(),
  trimTrailingSlash(),
  timeout(2e3),
  routingMiddleware
];

const Nav$2 = () => /* @__PURE__ */ jsxs("nav", { children: [
  /* @__PURE__ */ jsx("a", { href: "/", children: "Home" }),
  " | ",
  /* @__PURE__ */ jsx("a", { href: "/about", children: "About" }),
  " |",
  " ",
  /* @__PURE__ */ jsx("a", { href: "/contact", children: "Contact" })
] });
function Page$2() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Style, {}),
    /* @__PURE__ */ jsx("header", { children: /* @__PURE__ */ jsx("h1", { children: "Umaxica(app, edge)" }) }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx(Nav$2, {}),
    /* @__PURE__ */ jsx("h2", { children: "Welcome to umaxica" }),
    /* @__PURE__ */ jsx("p", { children: "This is the home page." }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("footer", { children: /* @__PURE__ */ jsx("p", { children: "© umaxica" }) })
  ] });
}

const Nav$1 = () => /* @__PURE__ */ jsxs("nav", { children: [
  /* @__PURE__ */ jsx("a", { href: "/", children: "Home" }),
  " | ",
  /* @__PURE__ */ jsx("a", { href: "/about", children: "About" }),
  " |",
  " ",
  /* @__PURE__ */ jsx("a", { href: "/contact", children: "Contact" })
] });
function About$1() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Style, {}),
    /* @__PURE__ */ jsx("header", { children: /* @__PURE__ */ jsx("h1", { children: "Umaxica(app, edge)" }) }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx(Nav$1, {}),
    /* @__PURE__ */ jsx("h2", { children: "About" }),
    /* @__PURE__ */ jsx("p", { children: "About page of umaxica" }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("footer", { children: /* @__PURE__ */ jsx("p", { children: "© umaxica" }) })
  ] });
}

const Nav = () => /* @__PURE__ */ jsxs("nav", { children: [
  /* @__PURE__ */ jsx("a", { href: "/", children: "Home" }),
  " | ",
  /* @__PURE__ */ jsx("a", { href: "/about", children: "About" }),
  " |",
  " ",
  /* @__PURE__ */ jsx("a", { href: "/contact", children: "Contact" })
] });
function Contact() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Style, {}),
    /* @__PURE__ */ jsx("header", { children: /* @__PURE__ */ jsx("h1", { children: "Umaxica(app, edge)" }) }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx(Nav, {}),
    /* @__PURE__ */ jsx("h2", { children: "Contact" }),
    /* @__PURE__ */ jsx("p", { children: "Contact us at contact@umaxica.app" }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("footer", { children: /* @__PURE__ */ jsx("p", { children: "© umaxica" }) })
  ] });
}

function HealthJson(c) {
  return c.json({ status: "OK" });
}

function Health() {
  return /* @__PURE__ */ jsx("p", { children: "OK" });
}

function Page$1() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Style, {}),
    /* @__PURE__ */ jsx("header", { children: /* @__PURE__ */ jsx("h1", { children: "Umaxica(org, edge)" }) }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("p", { children: "Welcome to umaxica" }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("footer", { children: /* @__PURE__ */ jsx("p", { children: "© umaxica" }) })
  ] });
}

function About() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Style, {}),
    /* @__PURE__ */ jsx("header", { children: /* @__PURE__ */ jsx("h1", { children: "Umaxica(org, edge)" }) }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("p", { children: "About page of umaxica" }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("footer", { children: /* @__PURE__ */ jsx("p", { children: "© umaxica" }) })
  ] });
}

function Page() {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Style, {}),
    /* @__PURE__ */ jsx("header", { children: /* @__PURE__ */ jsx("h1", { children: "Umaxica(org, edge)" }) }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("p", { children: "Welcome to umaxica" }),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsx("footer", { children: /* @__PURE__ */ jsx("p", { children: "© umaxica" }) })
  ] });
}

const app = new Hono();
app.use("*", ...middleware);
app.use(
  "*",
  jsxRenderer(({ children }) => {
    return /* @__PURE__ */ jsxs("html", { lang: "ja", children: [
      /* @__PURE__ */ jsxs("head", { children: [
        /* @__PURE__ */ jsx("meta", { charset: "utf-8" }),
        /* @__PURE__ */ jsx(
          "meta",
          {
            name: "viewport",
            content: "width=device-width, initial-scale=1.0"
          }
        ),
        /* @__PURE__ */ jsx("title", { children: "Umaxica" })
      ] }),
      /* @__PURE__ */ jsx("body", { children })
    ] });
  })
);
app.get("/app", (c) => c.render(/* @__PURE__ */ jsx(Page$2, {})));
app.get("/app/", (c) => c.render(/* @__PURE__ */ jsx(Page$2, {})));
app.get("/app/about", (c) => c.render(/* @__PURE__ */ jsx(About$1, {})));
app.get("/app/contact", (c) => c.render(/* @__PURE__ */ jsx(Contact, {})));
app.get("/app/health.json", HealthJson);
app.get("/app/health.html", (c) => c.render(/* @__PURE__ */ jsx(Health, {})));
app.get("/com", (c) => c.render(/* @__PURE__ */ jsx(Page$1, {})));
app.get("/com/", (c) => c.render(/* @__PURE__ */ jsx(Page$1, {})));
app.get("/com/about", (c) => c.render(/* @__PURE__ */ jsx(About, {})));
app.get("/org", (c) => c.render(/* @__PURE__ */ jsx(Page, {})));
app.get("/org/", (c) => c.render(/* @__PURE__ */ jsx(Page, {})));
showRoutes(app);
if (import.meta.main) {
  const port = 4e3;
  console.log(`Server is running on port ${port}`);
  Bun.serve({
    port,
    fetch: app.fetch
  });
}

export { app as default };
