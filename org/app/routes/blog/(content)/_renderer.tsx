import { jsxRenderer } from "hono/jsx-renderer";
import { createHMRScript } from "../../../../hmr-client";

export const renderer = jsxRenderer(({ children }) => {
	const isDev = process.env.NODE_ENV !== "production";

	return (
		<html lang="ja">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link href="/src/style.css" rel="stylesheet" />
				{isDev && (
					<>
						<script type="module" src="/@vite/client"></script>
						<script
							type="module"
							dangerouslySetInnerHTML={{
								__html: createHMRScript(),
							}}
						/>
					</>
				)}
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
