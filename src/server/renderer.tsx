import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }, c) => {
	const host = c.req.header("host") || "";
	const tenant = host.includes("app.")
		? "app"
		: host.includes("com.")
			? "com"
			: "org";

	return (
		<html lang="ja">
			<head>
				<link
					href={
						import.meta.env.PROD
							? `/assets/${tenant}/style.css`
							: `/src/client/${tenant}/style.css`
					}
					rel="stylesheet"
				/>
			</head>
			<body>
				{children}
				{/* biome-ignore lint/nursery/useUniqueElementIds: This is the React app mount point */}
				<div id="root" />
				{import.meta.env.PROD && <script src={`/assets/${tenant}/index.js`} />}
			</body>
		</html>
	);
});
