import {
	Fragment as _Fragment,
	jsx as _jsx,
	jsxs as _jsxs,
} from "react/jsx-runtime";
import { Link } from "react-router";
export function meta(_) {
	return [
		{ title: "configure" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}
export function loader({ context }) {
	return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}
export default function About(_) {
	return _jsxs(_Fragment, {
		children: [
			_jsx(Link, { to: "/", children: _jsx("h1", { children: "umaxica" }) }),
			_jsx(Link, { to: "/", children: "home" }),
			" &lt; ",
			_jsx(Link, { to: "/configure", children: "configure" }),
		],
	});
}
