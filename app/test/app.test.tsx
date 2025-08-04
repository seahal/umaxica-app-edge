import { test, expect } from "bun:test";
import { App } from "../App";

test("App component exists", () => {
	// Simple test to verify App component is defined
	expect(typeof App).toBe("function");
});

test("App component returns JSX", () => {
	// Test that the App component returns JSX structure
	expect(App.toString()).toContain("Layout");
	expect(App.toString()).toContain("Routes");
});
