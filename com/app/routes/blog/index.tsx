import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.render(
		<div>
			<h1>Blog</h1>
			<p>Welcome to the blog section.</p>
			<ul>
				<li>
					<a href="/blog/first-post">First Post</a>
				</li>
				<li>
					<a href="/blog/second-post">Second Post</a>
				</li>
			</ul>
			<a href="/">Back to home</a>
		</div>,
	);
});

export default app;
