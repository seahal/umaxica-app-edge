import type { Buffer as NodeBuffer } from "node:buffer";

const NONCE_BYTES = 16;

export function generateNonce() {
	const bytes = new Uint8Array(NONCE_BYTES);
	crypto.getRandomValues(bytes);
	let string = "";
	for (const byte of bytes) {
		string += String.fromCharCode(byte);
	}
	const nodeGlobal = globalThis as typeof globalThis & { Buffer?: NodeBuffer };
	const nodeBuffer = nodeGlobal.Buffer;
	let base64: string;
	if (typeof btoa === "function") {
		base64 = btoa(string);
	} else if (nodeBuffer) {
		base64 = nodeBuffer.from(string, "binary").toString("base64");
	} else {
		throw new Error("No base64 encoder available in this environment.");
	}
	return base64.replace(/=+$/, "");
}

/**
 * Attach security headers to a Response while preserving streaming body.
 */
export function withSecurityHeaders(
	request: Request,
	response: Response,
	_options?: { cspNonce?: string },
): Response {
	const headers = new Headers(response.headers);

	// Remove any existing CSP header until policy is reintroduced
	headers.delete("Content-Security-Policy");

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
