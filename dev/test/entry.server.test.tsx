import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";

import { CloudflareContext } from "../src/context";

const actualDomServer = await import("react-dom/server");

type RenderOptions = Parameters<
	typeof actualDomServer.renderToReadableStream
>[1];

let awaitedAllReady = false;
let lastOptions: RenderOptions | undefined;
let renderCalls: unknown[][] = [];

function createStream() {
	awaitedAllReady = false;
	const stream = new ReadableStream({
		start(controller) {
			controller.close();
		},
	});
	Object.assign(stream, {
		allReady: Promise.resolve().then(() => {
			awaitedAllReady = true;
		}),
	});
	return stream as ReadableStream & { allReady: Promise<void> };
}

let renderImplementation: (
	...args: unknown[]
) => ReturnType<typeof createStream> = (...args) => {
	renderCalls.push(args);
	lastOptions = args[1] as RenderOptions;
	return createStream();
};

mock.module("react-dom/server", () => ({
	renderToReadableStream: (...args: unknown[]) => renderImplementation(...args),
}));

let isBot = false;
mock.module("isbot", () => ({
	isbot: () => isBot,
}));

const handleRequest = (
	await import(new URL("../src/entry.server.tsx", import.meta.url).href)
).default;

afterEach(() => {
	renderCalls = [];
	lastOptions = undefined;
	renderImplementation = (...args) => {
		renderCalls.push(args);
		lastOptions = args[1] as RenderOptions;
		return createStream();
	};
});

afterAll(async () => {
	const actualIsBot = await import("isbot");
	mock.module("react-dom/server", () => actualDomServer);
	mock.module("isbot", () => actualIsBot);
});

describe("dev entry server handleRequest", () => {
	let headers: Headers;

	beforeEach(() => {
		headers = new Headers();
	});

	it("renders html for bots and sets strict security headers", async () => {
		isBot = true;
		const request = new Request("https://dev.example.com", {
			headers: { "user-agent": "Googlebot" },
		});
		const routerContext = {
			isSpaMode: false,
		} as unknown as import("react-router").EntryContext;

		const contextMap = new Map();
		contextMap.set(CloudflareContext, {
			security: { nonce: "nonce-456" },
		});
		const loadContext = {
			get: (key: symbol) => contextMap.get(key),
		};

		const response = await handleRequest(
			request,
			200,
			headers,
			routerContext,
			loadContext,
		);

		expect(renderCalls.length).toBe(1);
		expect(awaitedAllReady).toBe(true);
		expect(lastOptions?.nonce).toBe("nonce-456");
		expect(response.headers.get("Content-Type")).toBe("text/html");
		expect(response.headers.get("Strict-Transport-Security")).toContain(
			"max-age=31536000",
		);
		expect(response.headers.get("Content-Security-Policy")).toContain(
			"nonce-456",
		);
		expect(response.headers.get("Permissions-Policy")).toContain(
			"microphone=()",
		);
	});

	it("waits for shell completion when router is in SPA mode", async () => {
		isBot = false;
		const request = new Request("https://dev.example.com/app", {
			headers: { "user-agent": "Mozilla/5.0" },
		});
		const routerContext = {
			isSpaMode: true,
		} as unknown as import("react-router").EntryContext;

		const contextMap = new Map();
		const loadContext = {
			get: (key: symbol) => contextMap.get(key),
		};

		await handleRequest(request, 200, headers, routerContext, loadContext);

		expect(awaitedAllReady).toBe(true);
	});

	it("logs streaming errors that occur after the shell renders", async () => {
		isBot = false;
		const request = new Request("https://dev.example.com/error");
		const routerContext = {
			isSpaMode: false,
		} as unknown as import("react-router").EntryContext;
		const originalConsoleError = console.error;
		const errorCalls: unknown[][] = [];
		console.error = (...args: unknown[]) => {
			errorCalls.push(args);
		};

		renderImplementation = (...args) => {
			renderCalls.push(args);
			const options = args[1] as RenderOptions | undefined;
			const stream = createStream();
			setTimeout(() => {
				options?.onError?.(new Error("stream failure"), {
					componentStack: "",
				});
			}, 0);
			return stream;
		};

		try {
			const contextMap = new Map();
			const loadContext = {
				get: (key: symbol) => contextMap.get(key),
			};
			await handleRequest(request, 200, headers, routerContext, loadContext);
			await new Promise((resolve) => setTimeout(resolve, 0));
			expect(errorCalls.length).toBeGreaterThan(0);
			const [firstCall] = errorCalls;
			expect(firstCall).toBeDefined();
			expect(firstCall?.[0]).toBeInstanceOf(Error);
		} finally {
			console.error = originalConsoleError;
		}
	});
});
