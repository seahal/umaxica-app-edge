import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, type PluginOption } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";
import honox from "honox/vite";

export default defineConfig({
	plugins: [honox(), cloudflare(), ssrPlugin()] as PluginOption[],
});
