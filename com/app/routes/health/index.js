import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => {
	return c.render(
		_jsxs("div", {
			children: [
				_jsx("h1", { children: "Health Check" }),
				_jsx("p", { children: "Service is running" }),
			],
		}),
	);
});
export default app;
