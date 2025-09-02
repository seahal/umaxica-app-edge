import type { Config } from "@react-router/dev/config";

export default {
	appDirectory: "src",
	ssr: true,
	buildDirectory: "build",
	serverBuildFile: "worker.js",
	serverConditions: ["workerd", "worker"],
	serverDependenciesToBundle: "all",
	serverMainFields: ["browser", "module", "main"],
	serverMinify: true,
	serverModuleFormat: "esm",
	serverPlatform: "neutral",
	future: {
		unstable_viteEnvironmentApi: true,
	},
} satisfies Config;
