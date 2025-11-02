import { Window } from "happy-dom";

const ensureDomGlobals = () => {
	const existingWindow = globalThis.window as unknown;
	if (existingWindow && globalThis.document) {
		return existingWindow;
	}

	const happyWindow = new Window();
	const { document } = happyWindow;

	globalThis.window = happyWindow as unknown as Window &
		typeof globalThis.window;
	globalThis.document = document;
	globalThis.navigator = happyWindow.navigator;
	globalThis.HTMLElement = happyWindow.HTMLElement;
	globalThis.HTMLInputElement = happyWindow.HTMLInputElement;
	globalThis.HTMLTextAreaElement = happyWindow.HTMLTextAreaElement;
	globalThis.HTMLButtonElement = happyWindow.HTMLButtonElement;
	globalThis.HTMLSelectElement = happyWindow.HTMLSelectElement;
	globalThis.SVGElement = happyWindow.SVGElement;
	globalThis.Node = happyWindow.Node;
	globalThis.Event = happyWindow.Event;
	globalThis.CustomEvent = happyWindow.CustomEvent;
	globalThis.MutationObserver = happyWindow.MutationObserver;
globalThis.Element = happyWindow.Element;
globalThis.NodeFilter = happyWindow.NodeFilter;

	return happyWindow;
};

const activeWindow = ensureDomGlobals();

// Stable timer resolution improves react-aria animations in tests.
activeWindow.requestAnimationFrame ??= (cb: FrameRequestCallback) =>
	setTimeout(() => cb(Date.now()), 16) as unknown as number;
activeWindow.cancelAnimationFrame ??= (id: number) => clearTimeout(id);

globalThis.requestAnimationFrame ??= activeWindow.requestAnimationFrame.bind(activeWindow);
globalThis.cancelAnimationFrame ??= activeWindow.cancelAnimationFrame.bind(activeWindow);

await import("@testing-library/jest-dom");
