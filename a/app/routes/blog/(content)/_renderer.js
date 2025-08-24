import { Outlet } from "react-router";

export default function BlogContentLayout() {
	return (
		<html lang="ja">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link href="/src/style.css" rel="stylesheet" />
				<title>App Blog Content</title>
			</head>
			<body>
				<nav>
					<a href="/blog">← Back to App Blog</a>
				</nav>
				<Outlet />
			</body>
		</html>
	);
}
