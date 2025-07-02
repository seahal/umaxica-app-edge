import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Style } from "hono/css";
export default function About() {
	return _jsxs("div", {
		children: [
			_jsx(Style, {}),
			_jsx("header", {
				children: _jsx("h1", { children: "Umaxica(com, edge)" }),
			}),
			_jsx("hr", {}),
			_jsx("p", { children: "About page of umaxica" }),
			_jsx("hr", {}),
			_jsx("footer", { children: _jsx("p", { children: "\u00A9 umaxica" }) }),
		],
	});
}
