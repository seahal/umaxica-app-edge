import {
	Fragment as _Fragment,
	jsx as _jsx,
	jsxs as _jsxs,
} from "hono/jsx/jsx-runtime";
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
	return _jsxs("html", {
		lang: "ja",
		children: [
			_jsxs("head", {
				children: [
					_jsx("meta", { charset: "UTF-8" }),
					_jsx("meta", {
						name: "viewport",
						content: "width=device-width, initial-scale=1.0",
					}),
					_jsx("link", { href: "/src/style.css", rel: "stylesheet" }),
					isDev &&
						_jsxs(_Fragment, {
							children: [
								_jsx("script", { type: "module", src: "/@vite/client" }),
								_jsx("script", {
									type: "module",
									dangerouslySetInnerHTML: {
										__html: hmrScript,
									},
								}),
							],
						}),
					_jsx("title", { children: "App Blog Content" }),
				],
			}),
			_jsxs("body", {
				children: [
					_jsx("nav", {
						children: _jsx("a", {
							href: "/blog",
							children: "\u2190 Back to App Blog",
						}),
					}),
					children,
				],
			}),
		],
	});
});
