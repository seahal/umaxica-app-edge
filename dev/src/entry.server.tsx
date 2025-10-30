import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
	loadContext: AppLoadContext,
) {
	let shellRendered = false;
	const userAgent = request.headers.get("user-agent");
	const nonce = loadContext?.security?.nonce ?? "";

	const body = await renderToReadableStream(
		<ServerRouter context={routerContext} url={request.url} />,
		{
			nonce: nonce || undefined,
			onError(error: unknown) {
				responseStatusCode = 500;
				// Log streaming rendering errors from inside the shell.  Don't log
				// errors encountered during initial shell rendering since they'll
				// reject and get logged in handleDocumentRequest.
				if (shellRendered) {
					console.error(error);
				}
			},
		},
	);
	shellRendered = true;

	// Ensure requests from bots and SPA Mode renders wait for all content to load before responding
	// https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
	if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
		await body.allReady;
	}

	responseHeaders.set("Content-Type", "text/html");
	responseHeaders.set(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains; preload",
	);
	responseHeaders.set(
		"Content-Security-Policy",
		`default-src 'self'; script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
	);
	responseHeaders.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=(), interest-cohort=()",
	);
	responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
	responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
	responseHeaders.set("X-Content-Type-Options", "nosniff");

	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	});
}
