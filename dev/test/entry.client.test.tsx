import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";

let transitionCalls = 0;
let hydrateCalls = 0;
let lastHydrateArgs: unknown[] = [];

type OnErrorHandler = (error: unknown, errorInfo: unknown) => void;
const isOnErrorHandler = (value: unknown): value is OnErrorHandler =>
	typeof value === "function";

let lastOnError: OnErrorHandler | undefined;

const actualReact = await import("react");
const mockStrictMode = actualReact.StrictMode;
const actualStartTransition = actualReact.startTransition;

mock.module("react", () => ({
	...actualReact,
	startTransition: (callback: () => void) => {
		transitionCalls += 1;
		if (typeof actualStartTransition === "function") {
			return actualStartTransition(callback);
		}
		callback();
	},
	StrictMode: mockStrictMode,
	default: {
		...(actualReact.default ?? {}),
		startTransition: (callback: () => void) => {
			transitionCalls += 1;
			if (typeof actualStartTransition === "function") {
				return actualStartTransition(callback);
			}
			callback();
		},
		StrictMode: mockStrictMode,
	},
}));

mock.module("react-dom/client", () => ({
	hydrateRoot: (...args: unknown[]) => {
		hydrateCalls += 1;
		lastHydrateArgs = args;
		const strictTree = args[1] as
			| { props?: { children?: unknown } }
			| undefined;
		const maybeChild = strictTree?.props?.children;
		const routerElement = Array.isArray(maybeChild)
			? maybeChild[0]
			: maybeChild;
		if (
			routerElement &&
			typeof routerElement === "object" &&
			"props" in routerElement &&
			routerElement.props
		) {
			const candidate = (routerElement as { props: Record<string, unknown> })
				.props.unstable_onError;
			if (isOnErrorHandler(candidate)) {
				lastOnError = candidate;
			}
		}
		return { root: true };
	},
}));

mock.module("react-router/dom", () => ({
	HydratedRouter: (props: Record<string, unknown>) => {
		const candidate = props.unstable_onError;
		if (isOnErrorHandler(candidate)) {
			lastOnError = candidate;
		}
		return actualReact.createElement("mock-router", props);
	},
}));

beforeAll(async () => {
	globalThis.document = { nodeType: 9 } as unknown as Document;
	await import("../src/entry.client");
});

afterAll(async () => {
	const actualReact = await import("react");
	const actualClient = await import("react-dom/client");
	const actualRouterDom = await import("react-router/dom");
	mock.module("react", () => actualReact);
	mock.module("react-dom/client", () => actualClient);
	mock.module("react-router/dom", () => actualRouterDom);
	Reflect.deleteProperty(globalThis as Record<string, unknown>, "document");
});

describe("dev entry client bootstrap", () => {
	it("hydrates immediately within startTransition", () => {
		expect(transitionCalls).toBeGreaterThan(0);
		expect(hydrateCalls).toBe(transitionCalls);
		expect(lastHydrateArgs[0]).toBe(globalThis.document);
		expect((lastHydrateArgs[1] as { type?: unknown })?.type).toBe(
			mockStrictMode,
		);
	});

	it("logs routing errors and delegates to the reporter", () => {
		expect(lastOnError).toBeDefined();
		const error = new Error("bootstrap failure");
		const errorInfo = { componentStack: "<App>" };
		const calls: unknown[][] = [];
		const originalConsoleError = console.error;
		console.error = (...args: unknown[]) => {
			calls.push(args);
		};

		try {
			expect(() => lastOnError?.(error, errorInfo)).toThrowError(
				"Function not implemented.",
			);
		} finally {
			console.error = originalConsoleError;
		}

		expect(calls).toHaveLength(1);
		expect(calls[0]).toEqual([error, errorInfo]);
	});
});
