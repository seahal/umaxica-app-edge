// Vitest setup for app
// Ensure a DOM-like environment when running component tests.
import { GlobalRegistrator } from "happy-dom";
import matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

if (typeof window === "undefined") {
	GlobalRegistrator.register();
}

expect.extend(matchers);
