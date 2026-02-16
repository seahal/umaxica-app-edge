import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@sentry/react-router": new URL(
        "./app_www/__mocks__/@sentry/react-router.ts",
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: [
      "app/**/*.test.{ts,tsx}",
      "com/**/*.test.{ts,tsx}",
      "org/**/*.test.{ts,tsx}",
      "app_www/**/*.test.{ts,tsx}",
      "com_www/**/*.test.{ts,tsx}",
      "org_www/**/*.test.{ts,tsx}",
      "dev_status/**/*.test.{ts,tsx}",
      "test/**/*.test.{ts,tsx}",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
