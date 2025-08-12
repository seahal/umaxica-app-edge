import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

export const renderer = jsxRenderer(({ children }) => {
	return (
		<html lang="ja">
			<head>
				<ViteClient />
				<Link href="/src/style.css" rel="stylesheet" />
				<title>App Blog Content</title>
			</head>
			<body>
				<nav>
					<a href="/blog">← Back to App Blog</a>
				</nav>
				{children}
			</body>
		</html>
	);
});
