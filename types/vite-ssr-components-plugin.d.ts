declare module "vite-ssr-components/plugin" {
	import type { Plugin } from "vite";
	const plugin: () => Plugin;
	export default plugin;
}
