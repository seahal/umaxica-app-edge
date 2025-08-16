import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
const app = new Hono();
app.get("/:name", (c) => {
	const name = c.req.param("name");
	return c.render(
		_jsxs("div", {
			children: [
				_jsxs("h1", { children: ["About ", name, " (Org)"] }),
				_jsxs("p", {
					children: ["This is the org about page for ", name, "."],
				}),
				_jsx("a", { href: "/", children: "Back to home" }),
			],
		}),
	);
});
export default app;
