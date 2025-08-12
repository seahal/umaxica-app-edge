import { Hono } from "hono";

const app = new Hono();

app.get("/*", (c) => {
	const path = c.req.path.replace("/merch/", "");
	const segments = path ? path.split("/") : [];

	return c.render(
		<div>
			<h1>App Merch Page</h1>
			<p>Slug segments: {segments.join(" > ")}</p>
			<ul>
				<li>Category: {segments[0] || "N/A"}</li>
				<li>Item: {segments[1] || "N/A"}</li>
				<li>Variant: {segments[2] || "N/A"}</li>
			</ul>
		</div>,
	);
});

export default app;
