import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Hono } from "hono";
const app = new Hono();
app.get("/*", (c) => {
	const path = c.req.path.replace("/merch/", "");
	const segments = path ? path.split("/") : [];
	return c.render(
		_jsxs("div", {
			children: [
				_jsx("h1", { children: "Merch Page" }),
				_jsxs("p", { children: ["Slug segments: ", segments.join(" > ")] }),
				_jsxs("ul", {
					children: [
						_jsxs("li", { children: ["Category: ", segments[0] || "N/A"] }),
						_jsxs("li", { children: ["Item: ", segments[1] || "N/A"] }),
						_jsxs("li", { children: ["Variant: ", segments[2] || "N/A"] }),
					],
				}),
			],
		}),
	);
});
export default app;
