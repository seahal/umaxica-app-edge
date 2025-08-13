import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
	const isDev = process.env.NODE_ENV !== "production";

	const hmrScript = `
		if (import.meta.hot) {
			import.meta.hot.accept();
			
			import.meta.hot.on('vite:beforeUpdate', () => {
				console.log('🔥 HMR: Updating...');
				const indicator = document.createElement('div');
				indicator.id = 'hmr-indicator';
				indicator.style.cssText = \`
					position: fixed; top: 10px; right: 10px; background: #ff6b35;
					color: white; padding: 8px 12px; border-radius: 4px;
					font-family: monospace; font-size: 12px; z-index: 9999;
				\`;
				indicator.textContent = '🔥 Updating...';
				document.body.appendChild(indicator);
			});
			
			import.meta.hot.on('vite:afterUpdate', () => {
				console.log('✅ HMR: Updated successfully');
				const indicator = document.getElementById('hmr-indicator');
				if (indicator) {
					indicator.style.background = '#28a745';
					indicator.textContent = '✅ Updated';
					setTimeout(() => indicator.remove(), 2000);
				}
			});
		}
	`;

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
								__html: hmrScript,
							}}
						/>
					</>
				)}
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
