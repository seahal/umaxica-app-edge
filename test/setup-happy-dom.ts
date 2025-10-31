import { Window } from "happy-dom";

// Create a shared happy-dom window for component tests that rely on document globals.
const happyDomWindow = new Window();

const globalTargets: Record<string, unknown> = {
	window: happyDomWindow,
	document: happyDomWindow.document,
	navigator: happyDomWindow.navigator,
	Node: happyDomWindow.Node,
	HTMLElement: happyDomWindow.HTMLElement,
	MutationObserver: happyDomWindow.MutationObserver,
	ResizeObserver: happyDomWindow.ResizeObserver,
	CustomEvent: happyDomWindow.CustomEvent,
	DOMParser: happyDomWindow.DOMParser,
	crypto: happyDomWindow.crypto,
};

for (const [key, value] of Object.entries(globalTargets)) {
	if (!(key in globalThis)) {
		Object.defineProperty(globalThis, key, {
			configurable: true,
			writable: true,
			value,
		});
	}
}

const raf: (callback: FrameRequestCallback) => number = (callback) => {
	const handle = happyDomWindow.setTimeout(() => {
		callback(Date.now());
	}, 16);
	return handle as unknown as number;
};

const caf: (handle: number) => void = (handle) => {
	happyDomWindow.clearTimeout(
		handle as unknown as Parameters<Window["clearTimeout"]>[0],
	);
};

if (typeof globalThis.requestAnimationFrame !== "function") {
	globalThis.requestAnimationFrame = raf;
}

if (typeof globalThis.cancelAnimationFrame !== "function") {
	globalThis.cancelAnimationFrame = caf;
}

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT ??= true;
