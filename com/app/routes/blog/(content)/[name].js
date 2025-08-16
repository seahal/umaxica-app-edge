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
				_jsx("h1", {
					children: name
						.replace("-", " ")
						.replace(/\b\w/g, (l) => l.toUpperCase()),
				}),
				_jsxs("p", {
					children: ['This is the blog post content for "', name, '".'],
				}),
				_jsx("p", {
					children:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmo tempor incididunt ut labore et dolore magna aliqua",
				}),
			],
		}),
	);
});
export default app;
