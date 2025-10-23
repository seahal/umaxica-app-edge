import type { Plugin, UserConfig } from "vite";

const NONCE_ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * Generate a cryptographically random nonce that can be embedded in CSP headers.
 */
export function generateNonce(length = 32): string {
	const characters = NONCE_ALPHABET;
	const count = characters.length;
	const hasCrypto =
		typeof crypto !== "undefined" &&
		typeof crypto.getRandomValues === "function";

	if (hasCrypto) {
		const buffer = new Uint8Array(length);
		const maxMultiple = Math.floor(256 / count) * count;
		let remaining = length;
		let result = "";

		while (remaining > 0) {
			crypto.getRandomValues(buffer);
			for (let index = 0; index < buffer.length && remaining > 0; index++) {
				const value = buffer[index]!;
				if (value >= maxMultiple) {
					continue;
				}
				result += characters[value % count]!;
				remaining -= 1;
			}
		}

		return result;
	}

	let fallback = "";
	for (let index = 0; index < length; index++) {
		const random = Math.floor(Math.random() * count);
		fallback += characters[random]!;
	}
	return fallback;
}

type DirectiveOverrides = Partial<Record<string, string>>;

export interface SecurityHeaderOptions {
	/**
	 * Nonce that will be embedded in the `script-src` directive.
	 */
	cspNonce?: string;
	/**
	 * Allows callers to override or extend the generated CSP directives.
	 */
	cspDirectives?: DirectiveOverrides;
	/**
	 * When true, emit the policy using the report-only header instead of enforcing it.
	 */
	reportOnly?: boolean;
	/**
	 * Skip generating Content-Security-Policy headers.
	 */
	disableCsp?: boolean;
}

/**
 * Attach a hardened set of security headers to the outgoing response.
 * Designed to be framework agnostic so each domain can opt-in independently.
 */
export function withSecurityHeaders(
	request: Request,
	response: Response,
	options: SecurityHeaderOptions = {},
): Response {
	const headers = response.headers;
	setIfMissing(headers, "Referrer-Policy", "strict-origin-when-cross-origin");
	setIfMissing(headers, "X-Content-Type-Options", "nosniff");
	setIfMissing(headers, "X-Frame-Options", "DENY");
	setIfMissing(headers, "X-XSS-Protection", "0");
	setIfMissing(headers, "Cross-Origin-Embedder-Policy", "require-corp");
	setIfMissing(headers, "Cross-Origin-Opener-Policy", "same-origin");
	setIfMissing(headers, "Cross-Origin-Resource-Policy", "same-origin");
	setIfMissing(
		headers,
		"Permissions-Policy",
		[
			"accelerometer=()",
			"ambient-light-sensor=()",
			"autoplay=()",
			"battery=()",
			"camera=()",
			"display-capture=()",
			"document-domain=()",
			"encrypted-media=()",
			"fullscreen=()",
			"geolocation=()",
			"gyroscope=()",
			"hid=()",
			"magnetometer=()",
			"microphone=()",
			"midi=()",
			"payment=()",
			"picture-in-picture=()",
			"publickey-credentials-get=()",
			"screen-wake-lock=()",
			"usb=()",
			"web-share=()",
			"xr-spatial-tracking=()",
		].join(", "),
	);
	setIfMissing(
		headers,
		"Strict-Transport-Security",
		"max-age=63072000; includeSubDomains; preload",
	);

	const contentType =
		headers.get("Content-Type") ?? response.headers.get("content-type") ?? "";
	const { disableCsp, reportOnly, cspNonce, cspDirectives } = options;
	if (!disableCsp && contentType.includes("text/html")) {
		const policy = buildContentSecurityPolicy(request, {
			nonce: cspNonce,
			overrides: cspDirectives,
		});
		const cspHeader = reportOnly
			? "Content-Security-Policy-Report-Only"
			: "Content-Security-Policy";
		headers.set(cspHeader, policy);
	}

	return response;
}

function setIfMissing(headers: Headers, key: string, value: string) {
	if (!headers.has(key)) {
		headers.set(key, value);
	}
}

interface BuildCspOptions {
	nonce?: string;
	overrides?: DirectiveOverrides;
}

function buildContentSecurityPolicy(
	request: Request,
	{ nonce, overrides }: BuildCspOptions,
): string {
	const baseUrl = new URL(request.url);
	const selfOrigin = `${baseUrl.protocol}//${baseUrl.host}`;

	const directives: Record<string, string> = {
		"base-uri": `'self'`,
		"child-src": `'self'`,
		"connect-src": `'self' ${selfOrigin} https: wss:`,
		"default-src": `'self'`,
		"font-src": `'self' data: https:`,
		"form-action": `'self'`,
		"frame-ancestors": `'none'`,
		"img-src": `'self' data: blob: https:`,
		"manifest-src": `'self'`,
		"media-src": `'self'`,
		"object-src": `'none'`,
		"prefetch-src": `'self'`,
		"script-src": `'self'${nonce ? ` 'nonce-${nonce}'` : ""}`,
		"script-src-attr": `'none'`,
		"script-src-elem": `'self'${nonce ? ` 'nonce-${nonce}'` : ""}`,
		"style-src": `'self' 'unsafe-inline'`,
		"worker-src": `'self' blob:'`,
	};

	if (overrides) {
		for (const [directive, value] of Object.entries(overrides)) {
			directives[directive] = value;
		}
	}

	const serialized = Object.entries(directives)
		.map(([key, value]) => `${key} ${value}`.trim())
		.filter(Boolean)
		.join("; ");

	return serialized;
}

/**
 * Detect whether the current runtime is a development environment.
 * Works across Node, Bun, Vite, and Cloudflare Workers.
 */
export function isDevelopmentEnvironment(): boolean {
	if (
		typeof import.meta !== "undefined" &&
		typeof (import.meta as unknown as { env?: Record<string, unknown> }).env ===
			"object"
	) {
		const env = (import.meta as unknown as { env?: Record<string, unknown> })
			.env;
		if (env) {
			if (typeof env.DEV === "boolean") {
				return env.DEV;
			}
			if (typeof env.MODE === "string") {
				return env.MODE !== "production";
			}
		}
	}

	if (
		typeof process !== "undefined" &&
		typeof process.env?.NODE_ENV === "string"
	) {
		return process.env.NODE_ENV !== "production";
	}

	return false;
}

/**
 * Transitional plugin to help migrate legacy optimizeDeps configuration between Vite versions.
 * It keeps `optimizeDeps` populated when older configs used `ssr.optimizeDeps`.
 */
export function migrateOptimizeDepsPlugin(): Plugin {
	return {
		name: "edge-runtime:migrate-optimize-deps",
		enforce: "pre",
		config(userConfig: UserConfig) {
			const ssrOptimizeDeps = userConfig.ssr?.optimizeDeps;
			if (ssrOptimizeDeps && !userConfig.optimizeDeps) {
				return {
					optimizeDeps: {
						...ssrOptimizeDeps,
					},
				};
			}
			return undefined;
		},
	};
}
