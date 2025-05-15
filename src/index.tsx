import { Hono } from "hono/quick";
import { renderer } from "./renderer";
import { languageDetector } from "hono/language";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { timeout } from "hono/timeout";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { trimTrailingSlash } from "hono/trailing-slash";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono({
	getPath: (req) => req.url.replace(/^https?:\/([^?]+).*$/, "$1"),
});

// languageDetector
app.use(
	languageDetector({
		supportedLanguages: ["en", "ja"], // Must include fallback
		fallbackLanguage: "ja", // Required
	}),
);
app.use(csrf());
app.use(cors());
app.use(logger());
app.use(prettyJSON());
app.use(trimTrailingSlash());
app.use(secureHeaders());
app.use(renderer);
app.use(timeout(2000));


// FIXME: use .env file
app.get("/app.localdomain:4444/", (c) => c.text("app"));
app.get("/jp.umaxica.app/", (c) => c.text("app"));
app.get("/com.localdomain:4444/", (c) => c.text("com"));
app.get("/jp.umaxica.com/", (c) => c.text("com"));
app.get("/org.localdomain:4444/", (c) => c.text("org"));
app.get("/jp.umaxica.org/", (c) => c.text("org"));

export default app;
