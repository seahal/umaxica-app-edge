/**
 * Shared configuration for the Umaxica Edge application
 * Centralized configuration management for all domains
 */

export const HMR_PORTS = {
	app: 24678,
	com: 24679,
	org: 24680,
} as const;

export type Domain = keyof typeof HMR_PORTS;

export const config = {
	/**
	 * Hot Module Replacement configuration
	 */
	hmr: {
		ports: HMR_PORTS,
		retryAttempts: 3,
		timeout: 5000,
		indicatorDuration: 2000, // How long to show success indicator
		retryDelay: 1000, // Delay between retries
		enableVisualFeedback: true,
		enableConsoleLogging: true,
	},

	/**
	 * Development environment configuration
	 */
	development: {
		logRequests: true,
		showHMRIndicator: true,
		enableDetailedLogging: false,
		corsAllowAll: true, // Allow all origins in development
		enableSourceMaps: true,
	},

	/**
	 * Production environment configuration
	 */
	production: {
		logRequests: false,
		enableCompressionLogging: false,
		strictCSP: true,
		enableMetrics: true,
	},

	/**
	 * Security configuration
	 */
	security: {
		development: {
			csp: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'report-sample'"],
				styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
				fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
				imgSrc: ["'self'", "data:"],
				connectSrc: ["'self'", "ws:", "wss:"],
				frameAncestors: ["'none'"],
				baseUri: ["'self'"],
			},
		},
		production: {
			csp: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'report-sample'"],
				styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
				fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
				imgSrc: ["'self'", "data:"],
				connectSrc: ["'self'"],
				frameAncestors: ["'none'"],
				baseUri: ["'self'"],
			},
		},
	},

	/**
	 * Server configuration
	 */
	server: {
		requestTimeout: 30000, // 30 seconds
		maxRequestSize: "50mb",
		enableGzip: true,
	},

	/**
	 * Domains configuration
	 */
	domains: {
		app: {
			title: "App",
			description: "Umaxica App Domain",
		},
		com: {
			title: "Com",
			description: "Umaxica Commercial Domain",
		},
		org: {
			title: "Org",
			description: "Umaxica Organization Domain",
		},
	},
} as const;

/**
 * Environment detection utilities
 */
export const env = {
	// Use Vite's compile-time env flags for browser/Workers compatibility
	isDevelopment: () => import.meta.env.DEV,
	isProduction: () => import.meta.env.PROD,
	isTest: () => import.meta.env.MODE === "test",
} as const;

/**
 * Get configuration for current environment
 */
export function getConfig() {
	const isDev = env.isDevelopment();

	return {
		...config,
		current: {
			environment: isDev ? "development" : "production",
			...config[isDev ? "development" : "production"],
			security: config.security[isDev ? "development" : "production"],
		},
	};
}

/**
 * Generate CSP string from configuration
 */
export function generateCSP(
	environment: "development" | "production" = "development",
	options?: { nonce?: string },
): string {
	const csp = config.security[environment].csp;

	return Object.entries(csp)
		.map(([key, value]) => {
			const directiveValues = Array.isArray(value) ? [...value] : String(value).split(/\s+/).filter(Boolean);
			if (key === "scriptSrc" && options?.nonce) {
				directiveValues.push(`'nonce-${options.nonce}'`);
			}
			// Convert camelCase to kebab-case
			const directive = key.replace(
				/[A-Z]/g,
				(letter) => `-${letter.toLowerCase()}`,
			);
			return `${directive} ${directiveValues.join(" ")}`;
		})
		.join("; ");
}
