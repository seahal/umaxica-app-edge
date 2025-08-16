import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => {
	return c.render(_jsx("h1", { children: "Hello, org!" }));
});
export default app;
