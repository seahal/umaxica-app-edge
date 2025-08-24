import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.render(<h1>Hello, app!</h1>);
});

export default app;
