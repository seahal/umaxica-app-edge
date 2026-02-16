import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
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
        inspectorPort: false, // avoid get-port syscall failures in restricted runtimes
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
    ],
    optimizeDeps: {
      // Suppress deprecated esbuildOptions warning for Rolldown
      esbuildOptions: undefined,
    },
    server: {
      host: true,
      port: 5170,
      strictPort: true,
      watch: {
        usePolling: true,
      },
    },
  };
});
