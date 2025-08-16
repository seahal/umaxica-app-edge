import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => {
	return c.render(
		_jsxs("div", {
			children: [
				_jsx("h1", { children: "Blog" }),
				_jsx("p", { children: "Welcome to the blog section." }),
				_jsxs("ul", {
					children: [
						_jsx("li", {
							children: _jsx("a", {
								href: "/blog/first-post",
								children: "First Post",
							}),
						}),
						_jsx("li", {
							children: _jsx("a", {
								href: "/blog/second-post",
								children: "Second Post",
							}),
						}),
					],
				}),
				_jsx("a", { href: "/", children: "Back to home" }),
			],
		}),
	);
});
export default app;
