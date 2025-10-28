/**
 * React Router v7 Middleware
 *
 * This middleware runs before route loaders and actions.
 * It can be used for:
 * - Authentication checks
 * - Request logging
 * - Headers manipulation
 * - Security policies (CSP, CORS, etc.)
 */
export const unstable_middleware = async ({ request, context }: any, next: any) => {
	// You can access Cloudflare Workers env in Cloudflare deployments
	// const { env } = context.cloudflare || {};

	// Log the request (optional)
	console.log(`[Middleware] ${request.method} ${request.url}`);

	// Call next() to continue to the route handler
	const response = await next();

	// You can modify the response headers here if needed
	// response.headers.set("X-Custom-Header", "value");

	return response;
};
