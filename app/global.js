import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Style } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";
import { Script } from "honox/server";
export default jsxRenderer(({ children }) => {
	return _jsxs("html", {
		lang: "ja",
		children: [
			_jsxs("head", {
				children: [
					_jsx("meta", { charset: "utf-8" }),
					_jsx("meta", {
						name: "viewport",
						content: "width=device-width, initial-scale=1.0",
					}),
					_jsx("title", { children: "Umaxica" }),
					_jsx(Script, { src: "/app/client.tsx", async: true }),
					_jsx(Style, {}),
				],
			}),
			_jsx("body", { children: children }),
		],
	});
});
