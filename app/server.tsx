import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { jsxRenderer } from "hono/jsx-renderer";

import middleware from "./_middleware";
import AppIndex from "./routes/app/index";
import AppAbout from "./routes/app/about";
import AppContact from "./routes/app/contact";
import AppHealthJson from "./routes/app/health.json";
import AppHealthHtml from "./routes/app/health.html";
import ComIndex from "./routes/com/index";
import ComAbout from "./routes/com/about";
import OrgIndex from "./routes/org/index";

type Bindings = {
	EDGE_CORPORATE_URL: string;
	EDGE_SERVICE_URL: string;
	EDGE_STAFF_URL: string;
	API_CORPORATE_URL: string;
	API_SERVICE_URL: string;
	API_STAFF_URL: string;
	WWW_CORPORATE_URL: string;
	WWW_SERVICE_URL: string;
	WWW_STAFF_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", ...middleware);

app.use(
	"*",
	jsxRenderer(({ children }) => {
		return (
			<html lang="ja">
				<head>
					<meta charset="utf-8" />
					<meta
						name="viewport"
						content="width=device-width, initial-scale=1.0"
					/>
					<title>Umaxica</title>
				</head>
				<body>{children}</body>
			</html>
		);
	}),
);

app.get("/app", (c) => c.render(<AppIndex />));
app.get("/app/", (c) => c.render(<AppIndex />));
app.get("/app/about", (c) => c.render(<AppAbout />));
app.get("/app/contact", (c) => c.render(<AppContact />));
app.get("/app/health.json", AppHealthJson);
app.get("/app/health.html", (c) => c.render(<AppHealthHtml />));

app.get("/com", (c) => c.render(<ComIndex />));
app.get("/com/", (c) => c.render(<ComIndex />));
app.get("/com/about", (c) => c.render(<ComAbout />));

app.get("/org", (c) => c.render(<OrgIndex />));
app.get("/org/", (c) => c.render(<OrgIndex />));

showRoutes(app);

export default app;

// Development server
if (import.meta.main) {
	const port = 4000;
	console.log(`Server is running on port ${port}`);

	Bun.serve({
		port,
		fetch: app.fetch,
	});
}
