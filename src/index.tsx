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
// custom import
import app from "./route/app";
import com from "./route/com";
import org from "./route/org";
import world from "./route/world";

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
// for app
["/app.localdomain:4444/", "/jp.umaxica.app/"].forEach((it) =>
	main.route(it, app),
);
// for com
["/com.localdomain:4444/", "/jp.umaxica.com/"].forEach((it) =>
	main.route(it, com),
);
// for org
["/org.localdomain:4444/", "/jp.umaxica.org/"].forEach((it) =>
	main.route(it, org),
);
// Region selector 
main.route("/umaxica.org/", world);
main.route("/umaxica.com/", world);
main.route("/umaxica.app/", world);

// custom 404 page
main.notFound((c) =>
	c.html(
		<>
			<h1>404 Page Not Found</h1>
			<hr />
			<p>...</p>
		</>,
		404,
	),
);
// custom 500 page
main.onError((err, c): any => {
	c.html("<h1>500 Internal Server Error</h1>", 500);
	console.error(err);
});

export default main;
