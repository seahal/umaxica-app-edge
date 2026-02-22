import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type PluginOption } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";

const ReactCompilerConfig = {
  target: "19",
};

export default defineConfig(() => {
  return {
    plugins: [
      tailwindcss(),
      cloudflare({
        viteEnvironment: { name: "ssr" },
        inspectorPort: false,
      }),
      reactRouter(),
      babel({
        filter: /\.[jt]sx?$/,
        babelConfig: {
          presets: ["@babel/preset-typescript"],
          plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
        },
      }),
      tsconfigPaths(),
    ] as PluginOption[],
    optimizeDeps: {
      // Suppress deprecated esbuildOptions warning for Rolldown
      esbuildOptions: undefined,
    },
    server: {
      host: true,
      port: 5302,
      strictPort: true,
      watch: {
        usePolling: true,
      },
    },
    // Do not bind to Wrangler's port; let Vite choose its own (default 5173)
    // so the Cloudflare plugin can proxy HMR correctly through Wrangler dev.
  };
});
