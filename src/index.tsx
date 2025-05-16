import { Hono } from "hono/quick";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { languageDetector } from "hono/language";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { trimTrailingSlash } from "hono/trailing-slash";
import { renderer } from "./renderer";
import app from "./route/app";
import com from "./route/com";
import org from "./route/org";

const main = new Hono({
	getPath: (req) => req.url.replace(/^https?:\/([^?]+).*$/, "$1"),
});

// languageDetector
main.use(
	languageDetector({
		supportedLanguages: ["en", "ja"], // Must include fallback
		fallbackLanguage: "ja", // Required
	}),
);
main.use(csrf()); // to avoid CSRF attacks
main.use(cors()); // attaches CORS headers to the response
main.use(logger()); // log
main.use(prettyJSON());
main.use(trimTrailingSlash()); // url regularization
main.use(secureHeaders()); // security headers
main.use(renderer);
main.use(timeout(2000)); //

// Routing
// for env
main.route("/app.localdomain:4444/", app);
main.route("/com.localdomain:4444/", com);
main.route("/org.localdomain:4444/", org);
// for production
main.route("/jp.umaxica.app/", app);
main.route("/jp.umaxica.com/", com);
main.route("/jp.umaxica.org/", org);
// custom 404 page
main.notFound((c) => c.html("404 Not Found(app)", 404));
// custom 500 page
main.onError((err, c): any => {
	c.html("500 Internal Server Error", 500);
	console.error(err);
});

export default main;
