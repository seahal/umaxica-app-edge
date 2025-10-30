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
export const unstable_middleware = async (
	{ request }: { request: Request; context: unknown },
	next: () => Promise<Response>,
) => {
	// You can access Cloudflare Workers env in Cloudflare deployments
	// const { env } = context.cloudflare || {};

	// Log the request (optional)
	console.log(`[Middleware] ${request.method} ${request.url}`);

	// Call next() to continue to the route handler
	const response = await next();

	// Security Headers
	// Strict Transport Security - Force HTTPS
	response.headers.set(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains",
	);

	// Content Security Policy - Prevent XSS attacks
	response.headers.set(
		"Content-Security-Policy",
		"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
	);

	// Permissions Policy - Control browser features
	response.headers.set(
		"Permissions-Policy",
		"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
	);

	// Additional security headers
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	return response;
};
