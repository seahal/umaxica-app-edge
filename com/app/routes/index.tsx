import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.render(<h1>Hello, com!</h1>);
});

export default app;
