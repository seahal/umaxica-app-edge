import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.render(
		<div>
			<h1>Health Check</h1>
			<p>Service is running</p>
		</div>,
	);
});

export default app;
