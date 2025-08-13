import type { ErrorHandler } from "hono";

const handler: ErrorHandler = (err, c) => {
	console.error("Error:", err);
	return c.render(
		<div style="text-align: center; margin-top: 50px;">
			<h1>500 - Internal Server Error</h1>
			<p>Something went wrong on our end. Please try again later.</p>
			<a href="/">Go back to home</a>
		</div>,
	);
};

export default handler;
