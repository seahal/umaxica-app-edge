import { Hono } from "hono";
import { renderer } from "./renderer";
// import { languageDetector } from "hono/language";
import { Hono } from "hono/quick";
import { cors } from "hono/cors";
// import { compress } from "hono/compress";
import { csrf } from "hono/csrf";
import { timeout } from "hono/timeout";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { trimTrailingSlash } from "hono/trailing-slash";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

app.use(secureHeaders());
app.use(cors());
// app.use(compress());
app.use(csrf());
app.use(timeout(2000));
app.use(logger());
app.use(prettyJSON());
app.use(trimTrailingSlash());
app.use(renderer);

app.get("/", (c) => {
	return c.render(<h1>Hello, World! from Vite + Cloudflare Workers!!!</h1>);
});

export default app;
