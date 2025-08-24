import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { jsxRenderer } from "hono/jsx-renderer";
export default jsxRenderer(({ children, title }) => {
	return _jsxs("html", {
		lang: "ja",
		children: [
			_jsxs("head", {
				children: [
					_jsx("meta", { charSet: "utf-8" }),
					_jsx("meta", {
						name: "viewport",
						content: "width=device-width, initial-scale=1.0",
					}),
					_jsx("title", { children: title || "Umaxica Edge" }),
					_jsx("style", {
						children: `
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 40px; 
              background-color: #f1f5f9; 
              color: #1e293b;
            }
            /* Dynamic background colors based on hostname */
            body:has([data-domain="com"]) {
              background-color: #f8fafc;
            }
            body:has([data-domain="org"]) {
              background-color: #faf5ff;
            }
            h1 { 
              color: #3b82f6; 
              margin-bottom: 16px; 
            }
            p { 
              line-height: 1.6; 
              margin-bottom: 12px; 
            }
            ul {
              margin: 16px 0;
              line-height: 1.8;
            }
            li {
              margin-bottom: 8px;
            }
            a { 
              color: #3b82f6; 
              text-decoration: none; 
            }
            a:hover { 
              text-decoration: underline; 
            }
            .btn {
              display: inline-block;
              padding: 10px;
              margin-right: 10px;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
            .btn-primary {
              background-color: #3b82f6;
            }
            .btn-primary:hover {
              background-color: #2563eb;
            }
            .btn-secondary {
              background-color: #6366f1;
            }
            .btn-secondary:hover {
              background-color: #4f46e5;
            }
            .btn-gray {
              background-color: #6b7280;
            }
            .btn-gray:hover {
              background-color: #4b5563;
            }
          `,
					}),
				],
			}),
			_jsx("body", { children: children }),
		],
	});
});
