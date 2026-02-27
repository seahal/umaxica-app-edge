import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  appDirectory: 'src',
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
  } as Config['future'],
  presets: [vercelPreset()] as Config['presets'],
  ssr: true,
} satisfies Config;
