type MaybeMetaEnv = {
	DEV?: unknown;
	MODE?: unknown;
};

type MaybeProcessEnv = Record<string, string | undefined> | undefined;

const normalizeBoolean = (value: unknown): boolean | undefined => {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "true" || normalized === "1") {
			return true;
		}
		if (normalized === "false" || normalized === "0") {
			return false;
		}
	}
	return undefined;
};

const normalizeMode = (value: unknown): string | undefined => {
	return typeof value === "string" && value.length > 0
		? value.trim().toLowerCase()
		: undefined;
};

export const isDevelopmentEnvironment = (): boolean => {
	const metaEnv = (import.meta as ImportMeta & { env?: MaybeMetaEnv }).env;
	const metaFlag = normalizeBoolean(metaEnv?.DEV);
	if (metaFlag !== undefined) {
		return metaFlag;
	}

	const metaMode = normalizeMode(metaEnv?.MODE);
	if (metaMode) {
		return metaMode === "development";
	}

	const processEnv = (
		globalThis as typeof globalThis & {
			process?: { env?: MaybeProcessEnv };
		}
	).process?.env;
	const processFlag = normalizeBoolean(processEnv?.VITE_DEV);
	if (processFlag !== undefined) {
		return processFlag;
	}

	const processMode = normalizeMode(
		processEnv?.VITE_MODE ?? processEnv?.NODE_ENV,
	);
	return processMode === "development";
};
