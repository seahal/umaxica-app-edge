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
  const configuredPort = Number.parseInt(process.env.PORT ?? "5402", 10);
  const serverPort = Number.isNaN(configuredPort) ? 5402 : configuredPort;

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
    ],
    server: {
      host: true,
      port: serverPort,
      strictPort: false,
      watch: {
        usePolling: true,
      },
    },
  };
});
