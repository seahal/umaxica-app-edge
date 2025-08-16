import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
const handler = (c) => {
	return c.render(
		_jsxs("div", {
			style: "text-align: center; margin-top: 50px;",
			children: [
				_jsx("h1", { children: "404 - Page Not Found" }),
				_jsx("p", { children: "The page you are looking for does not exist." }),
				_jsx("a", { href: "/", children: "Go back to home" }),
			],
		}),
	);
};
export default handler;
