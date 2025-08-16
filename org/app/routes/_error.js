import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
const handler = (err, c) => {
	console.error("Error:", err);
	return c.render(
		_jsxs("div", {
			style: "text-align: center; margin-top: 50px;",
			children: [
				_jsx("h1", { children: "500 - Internal Server Error" }),
				_jsx("p", {
					children: "Something went wrong on our end. Please try again later.",
				}),
				_jsx("a", { href: "/", children: "Go back to home" }),
			],
		}),
	);
};
export default handler;
