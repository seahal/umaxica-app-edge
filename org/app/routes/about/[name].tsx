import { Hono } from "hono";

const app = new Hono();

app.get("/:name", (c) => {
	const name = c.req.param("name");

	return c.render(
		<div>
			<h1>About {name} (Org)</h1>
			<p>This is the org about page for {name}.</p>
			<a href="/">Back to home</a>
		</div>,
	);
});

export default app;
