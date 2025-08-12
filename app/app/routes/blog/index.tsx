import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.render(
		<div>
			<h1>App Blog</h1>
			<p>Welcome to the app blog section.</p>
			<ul>
				<li>
					<a href="/blog/app-update">App Update</a>
				</li>
				<li>
					<a href="/blog/new-features">New Features</a>
				</li>
			</ul>
			<a href="/">Back to home</a>
		</div>,
	);
});

export default app;
