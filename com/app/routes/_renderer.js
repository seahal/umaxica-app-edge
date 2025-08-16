import {
	Fragment as _Fragment,
	jsx as _jsx,
	jsxs as _jsxs,
} from "hono/jsx/jsx-runtime";
import { jsxRenderer } from "hono/jsx-renderer";
import { createHMRScript } from "../../hmr-client";
export const renderer = jsxRenderer(({ children }) => {
	const isDev = process.env.NODE_ENV !== "production";
	return _jsxs("html", {
		lang: "ja",
		children: [
			_jsxs("head", {
				children: [
					_jsx("meta", { charset: "UTF-8" }),
					_jsx("meta", {
						name: "viewport",
						content: "width=device-width, initial-scale=1.0",
					}),
					_jsx("link", { href: "/src/style.css", rel: "stylesheet" }),
					isDev &&
						_jsxs(_Fragment, {
							children: [
								_jsx("script", { type: "module", src: "/@vite/client" }),
								_jsx("script", {
									type: "module",
									dangerouslySetInnerHTML: {
										__html: createHMRScript(),
									},
								}),
							],
						}),
					_jsx("title", { children: "Com" }),
				],
			}),
			_jsx("body", { children: children }),
		],
	});
});
