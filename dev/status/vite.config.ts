import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import tsconfigPaths from 'vite-tsconfig-paths';

const ReactCompilerConfig = {
  target: '19',
};

export default defineConfig(() => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    babel({
      babelConfig: {
        // If you use TypeScript
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
        presets: ['@babel/preset-typescript'],
      },
      filter: /\.[jt]sx?$/,
    }),
    tsconfigPaths(),
  ],
  server: {
    host: true,
    port: 5502,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
}));
