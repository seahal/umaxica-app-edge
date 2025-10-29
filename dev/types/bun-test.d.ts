declare module "bun:test" {
	// biome-ignore lint/suspicious/noExplicitAny: Type definitions for external module
	const describe: any;
	// biome-ignore lint/suspicious/noExplicitAny: Type definitions for external module
	const it: any;
	// biome-ignore lint/suspicious/noExplicitAny: Type definitions for external module
	const test: any;
	// biome-ignore lint/suspicious/noExplicitAny: Type definitions for external module
	const expect: any;

	export { describe, expect, it, test };
}
