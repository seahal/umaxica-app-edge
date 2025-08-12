import { Hono } from "hono";
import { renderer } from "./_renderer";

const app = new Hono();

app.use("*", renderer);

app.get("/:name", (c) => {
	const name = c.req.param("name");

	return c.render(
		<article>
			<h1>{name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h1>
			<p>This is the blog post content for "{name}".</p>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
				tempor incididunt ut labore et dolore magna aliqua.
			</p>
		</article>,
	);
});

export default app;
