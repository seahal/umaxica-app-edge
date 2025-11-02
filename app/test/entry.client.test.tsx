import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";

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
	await import(new URL("../src/entry.client.tsx", import.meta.url).href)
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

describe("entry.client handleRequest", () => {
	let headers: Headers;

	beforeEach(() => {
		headers = new Headers();
	});

	it("renders response and waits for bots", async () => {
		isBot = true;
		const request = new Request("https://example.com/home", {
			headers: { "user-agent": "TestBot" },
		});
		const routerContext = {
			isSpaMode: false,
		} as unknown as import("react-router").EntryContext;

		const response = await handleRequest(
			request,
			200,
			headers,
			routerContext,
			{},
		);

		expect(renderCalls.length).toBe(1);
		expect(awaitedAllReady).toBe(true);
		expect(lastOptions?.nonce).toBeUndefined();
		expect(response.headers.get("Content-Type")).toBe("text/html");
		expect(response.status).toBe(200);
	});

	it("waits for SPA mode clients", async () => {
		isBot = false;
		const request = new Request("https://example.com/app");
		const routerContext = {
			isSpaMode: true,
		} as unknown as import("react-router").EntryContext;

		await handleRequest(request, 200, headers, routerContext, {});

		expect(awaitedAllReady).toBe(true);
	});
});
