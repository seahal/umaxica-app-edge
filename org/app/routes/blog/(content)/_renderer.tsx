import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

export const renderer = jsxRenderer(({ children }) => {
	return (
		<html lang="ja">
			<head>
				<ViteClient />
				<Link href="/src/style.css" rel="stylesheet" />
				<title>Org Blog Content</title>
			</head>
			<body>
				<nav>
					<a href="/blog">← Back to Org Blog</a>
				</nav>
				{children}
			</body>
		</html>
	);
});
