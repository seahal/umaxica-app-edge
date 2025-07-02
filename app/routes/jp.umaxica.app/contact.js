import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Style } from "hono/css";
const Nav = () =>
	_jsxs("nav", {
		children: [
			_jsx("a", { href: "/", children: "Home" }),
			" | ",
			_jsx("a", { href: "/about", children: "About" }),
			" |",
			" ",
			_jsx("a", { href: "/contact", children: "Contact" }),
		],
	});
export default function Contact() {
	return _jsxs("div", {
		children: [
			_jsx(Style, {}),
			_jsx("header", {
				children: _jsx("h1", { children: "Umaxica(app, edge)" }),
			}),
			_jsx("hr", {}),
			_jsx(Nav, {}),
			_jsx("h2", { children: "Contact" }),
			_jsx("p", { children: "Contact us at contact@umaxica.app" }),
			_jsx("hr", {}),
			_jsx("footer", { children: _jsx("p", { children: "\u00A9 umaxica" }) }),
		],
	});
}
