import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.render(
		<div>
			<h1>Org Blog</h1>
			<p>Welcome to the org blog section.</p>
			<ul>
				<li>
					<a href="/blog/staff-updates">Staff Updates</a>
				</li>
				<li>
					<a href="/blog/org-news">Org News</a>
				</li>
			</ul>
			<a href="/">Back to home</a>
		</div>,
	);
});

export default app;
