import { Window } from "happy-dom";

const ensureDomGlobals = () => {
	const existingWindow = globalThis.window as unknown;
	if (existingWindow) {
		return existingWindow;
	}

	const happyWindow = new Window();
	const { document } = happyWindow;

	globalThis.window = happyWindow as unknown as Window & typeof globalThis.window;
	globalThis.document = document;
	globalThis.navigator = happyWindow.navigator;
	globalThis.HTMLElement = happyWindow.HTMLElement;
	globalThis.Node = happyWindow.Node;
	globalThis.Event = happyWindow.Event;
	globalThis.CustomEvent = happyWindow.CustomEvent;
	globalThis.MutationObserver = happyWindow.MutationObserver;

	return happyWindow;
};

const activeWindow = ensureDomGlobals();

// Stable timer resolution improves react-aria animations in tests.
activeWindow.requestAnimationFrame ??= ((cb: FrameRequestCallback) =>
	setTimeout(() => cb(Date.now()), 16) as unknown as number);
activeWindow.cancelAnimationFrame ??= ((id: number) => clearTimeout(id));

await import("@testing-library/jest-dom");
