import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
import { renderer } from "./_renderer";
const app = new Hono();
app.use("*", renderer);
app.get("/:name", (c) => {
	const name = c.req.param("name");
	return c.render(
		_jsxs("article", {
			children: [
				_jsxs("h1", {
					children: [
						name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
						" (App",
					],
				}),
				_jsxs("p", {
					children: ['This is the app blog post content for "', name, '".'],
				}),
				_jsx("p", {
					children:
						"App-specific content: Lorem ipsum dolor sit amet, consectetur adipiscin elit",
				}),
			],
		}),
	);
});
export default app;
