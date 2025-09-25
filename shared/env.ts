type EnvKey =
	| "EDGE_CORPORATE_URL"
	| "EDGE_SERVICE_URL"
	| "EDGE_STAFF_URL"
	| "API_CORPORATE_URL"
	| "API_SERVICE_URL"
	| "API_STAFF_URL"
	| "WWW_CORPORATE_URL"
	| "WWW_SERVICE_URL"
	| "WWW_STAFF_URL"
	| "APEX_CORPORATE_URL"
	| "APEX_SERVICE_URL"
	| "APEX_STAFF_URL"
	| "AUTH_SERVICE_URL"
	| "AUTH_STAFF_URL"
	| "CODE_NAME"
	| "VALUE_FROM_CLOUDFLARE";

const defaults: Record<EnvKey, string> = {
	EDGE_CORPORATE_URL: "com.localhost",
	EDGE_SERVICE_URL: "app.localhost",
	EDGE_STAFF_URL: "org.localhost",
	API_CORPORATE_URL: "api.com.localhost:3300",
	API_SERVICE_URL: "api.app.localhost:3300",
	API_STAFF_URL: "api.org.localhost:3300",
	WWW_CORPORATE_URL: "",
	WWW_SERVICE_URL: "",
	WWW_STAFF_URL: "",
	APEX_CORPORATE_URL: "com.localhost:3300",
	APEX_SERVICE_URL: "app.localhost:3300",
	APEX_STAFF_URL: "org.localhost:3300",
	AUTH_SERVICE_URL: "auth.app.localhost:3300",
	AUTH_STAFF_URL: "auth.org.localhost:3300",
	CODE_NAME: "UMAXICA",
	VALUE_FROM_CLOUDFLARE: "",
};

type MaybeEnv = Record<string, string | undefined> | undefined;

const importMetaEnv =
	(import.meta as ImportMeta & { env?: MaybeEnv }).env ?? undefined;

const processEnv = (() => {
	const globalWithProcess = globalThis as typeof globalThis & {
		process?: { env?: MaybeEnv };
	};
	return globalWithProcess.process?.env;
})();

const resolveEnvValue = (key: EnvKey): string => {
	const envKey = `VITE_${key}`;
	const value = importMetaEnv?.[envKey] ?? processEnv?.[envKey];
	return typeof value === "string" && value.length > 0 ? value : defaults[key];
};

export const runtimeEnv: Record<EnvKey, string> = Object.keys(defaults).reduce(
	(acc, key) => {
		const typedKey = key as EnvKey;
		acc[typedKey] = resolveEnvValue(typedKey);
		return acc;
	},
	{} as Record<EnvKey, string>,
);

export type RuntimeEnv = typeof runtimeEnv;
