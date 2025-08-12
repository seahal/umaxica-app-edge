import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.render(<h1>Hello, org!</h1>);
});

export default app;
