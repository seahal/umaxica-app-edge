import { generateCSP } from "./config";

/**
 * Attach security headers to a Response while preserving streaming body.
 */
export function withSecurityHeaders(
	request: Request,
	response: Response,
): Response {
	const headers = new Headers(response.headers);

	const env: "development" | "production" = (import.meta as any).env?.DEV
		? "development"
		: "production";

	// Content Security Policy aligned with config and current asset usage
	try {
		headers.set("Content-Security-Policy", generateCSP(env));
	} catch {}

	// Clickjacking and referrer/data leakage protections
	headers.set("X-Frame-Options", "DENY");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("X-Content-Type-Options", "nosniff");

	// Lock down powerful features by default (adjust as needed per app)
	headers.set(
		"Permissions-Policy",
		[
			"accelerometer=()",
			"autoplay=()",
			"camera=()",
			"display-capture=()",
			"encrypted-media=()",
			"fullscreen=()",
			"geolocation=()",
			"gyroscope=()",
			"microphone=()",
			"midi=()",
			"payment=()",
			"usb=()",
			"magnetometer=()",
			"clipboard-read=()",
			"clipboard-write=()",
		].join(", "),
	);

	// Prevent cross-window leaks; avoid COEP unless cross-origin isolation is required
	headers.set("Cross-Origin-Opener-Policy", "same-origin");

	// HSTS only on HTTPS to avoid polluting local dev
	try {
		const url = new URL(request.url);
		if (url.protocol === "https:") {
			headers.set(
				"Strict-Transport-Security",
				"max-age=31536000; includeSubDomains; preload",
			);
		}
	} catch {}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
