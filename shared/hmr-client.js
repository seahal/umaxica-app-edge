/**
 * Consolidated Hot Module Replacement (HMR) client for Hono + Vite
 * Centralized HMR functionality with domain-specific behavior
 */
import { config, env } from "./config";
/**
 * HMR State Management
 */
class HMRState {
	retryCount = 0;
	currentIndicator = null;
	styleElement = null;
	maxRetries;
	retryDelay;
	enableVisualFeedback;
	enableConsoleLogging;
	constructor() {
		this.maxRetries = config.hmr.retryAttempts;
		this.retryDelay = config.hmr.retryDelay;
		this.enableVisualFeedback = config.hmr.enableVisualFeedback;
		this.enableConsoleLogging = config.hmr.enableConsoleLogging;
	}
	log(message, ...args) {
		if (this.enableConsoleLogging) {
			console.log(message, ...args);
		}
	}
	error(message, ...args) {
		console.error(message, ...args);
	}
	createIndicator(text, backgroundColor) {
		// Remove existing indicator
		this.removeIndicator();
		const indicator = document.createElement("div");
		indicator.id = "hmr-indicator";
		indicator.style.cssText = `
			position: fixed;
			top: 10px;
			right: 10px;
			background: ${backgroundColor};
			color: white;
			padding: 8px 12px;
			border-radius: 4px;
			font-family: monospace;
			font-size: 12px;
			z-index: 9999;
			animation: hmr-pulse 1s infinite;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
			transition: all 0.3s ease;
		`;
		indicator.textContent = text;
		// Add pulse animation if not exists
		this.ensurePulseAnimation();
		document.body.appendChild(indicator);
		this.currentIndicator = indicator;
		return indicator;
	}
	removeIndicator() {
		if (this.currentIndicator) {
			this.currentIndicator.remove();
			this.currentIndicator = null;
		}
	}
	ensurePulseAnimation() {
		if (this.styleElement) return;
		const style = document.createElement("style");
		style.id = "hmr-styles";
		style.textContent = `
			@keyframes hmr-pulse {
				0% { opacity: 1; }
				50% { opacity: 0.7; }
				100% { opacity: 1; }
			}
			
			@keyframes hmr-success {
				0% { transform: scale(1); }
				50% { transform: scale(1.05); }
				100% { transform: scale(1); }
			}
		`;
		document.head.appendChild(style);
		this.styleElement = style;
	}
	onBeforeUpdate() {
		this.log("🔥 HMR: Updating...");
		if (this.enableVisualFeedback) {
			this.createIndicator("🔥 Updating...", "#ff6b35");
		}
	}
	onAfterUpdate() {
		this.log("✅ HMR: Updated successfully");
		this.retryCount = 0; // Reset retry count on successful update
		if (this.enableVisualFeedback && this.currentIndicator) {
			this.currentIndicator.style.background = "#28a745";
			this.currentIndicator.style.animation = "hmr-success 0.5s ease";
			this.currentIndicator.textContent = "✅ Updated";
			setTimeout(() => {
				this.removeIndicator();
			}, config.hmr.indicatorDuration);
		}
	}
	onError(err) {
		this.error("❌ HMR Error:", err);
		if (this.enableVisualFeedback && this.currentIndicator) {
			this.currentIndicator.style.background = "#dc3545";
			this.currentIndicator.textContent = "❌ Error";
		}
		// Enhanced error handling with retry mechanism
		if (this.retryCount < this.maxRetries) {
			this.retryCount++;
			this.log(
				`🔄 HMR: Retrying (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms...`,
			);
			if (this.enableVisualFeedback && this.currentIndicator) {
				this.currentIndicator.style.background = "#ffc107";
				this.currentIndicator.textContent = `🔄 Retry ${this.retryCount}/${this.maxRetries}`;
			}
			setTimeout(() => {
				window.location.reload();
			}, this.retryDelay);
		} else {
			this.error("❌ HMR: Max retries exceeded. Manual refresh required.");
			if (this.enableVisualFeedback && this.currentIndicator) {
				this.currentIndicator.style.background = "#6f42c1";
				this.currentIndicator.textContent = "🔄 Refresh needed";
				this.currentIndicator.style.cursor = "pointer";
				this.currentIndicator.onclick = () => window.location.reload();
			}
		}
	}
	cleanup() {
		this.removeIndicator();
		if (this.styleElement) {
			this.styleElement.remove();
			this.styleElement = null;
		}
	}
}
/**
 * Create HMR script with domain-specific behavior
 */
export function createHMRScript(domain) {
	const hmrPort = domain ? config.hmr.ports[domain] : undefined;
	return `
		// HMR Client Setup for ${domain || "default"} domain
		if (import.meta.hot) {
			// HMR State Management
			class HMRState {
				constructor() {
					this.retryCount = 0;
					this.currentIndicator = null;
					this.styleElement = null;
					this.maxRetries = ${config.hmr.retryAttempts};
					this.retryDelay = ${config.hmr.retryDelay};
					this.enableVisualFeedback = ${config.hmr.enableVisualFeedback};
					this.enableConsoleLogging = ${config.hmr.enableConsoleLogging};
				}

				log(message, ...args) {
					if (this.enableConsoleLogging) {
						console.log(message, ...args);
					}
				}

				error(message, ...args) {
					console.error(message, ...args);
				}

				createIndicator(text, backgroundColor) {
					this.removeIndicator();
					const indicator = document.createElement('div');
					indicator.id = 'hmr-indicator';
					indicator.style.cssText = \`
						position: fixed; top: 10px; right: 10px; background: \${backgroundColor};
						color: white; padding: 8px 12px; border-radius: 4px;
						font-family: monospace; font-size: 12px; z-index: 9999;
						animation: hmr-pulse 1s infinite; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
						transition: all 0.3s ease;
					\`;
					indicator.textContent = text;
					this.ensurePulseAnimation();
					document.body.appendChild(indicator);
					this.currentIndicator = indicator;
					return indicator;
				}

				removeIndicator() {
					if (this.currentIndicator) {
						this.currentIndicator.remove();
						this.currentIndicator = null;
					}
				}

				ensurePulseAnimation() {
					if (this.styleElement) return;
					const style = document.createElement('style');
					style.id = 'hmr-styles';
					style.textContent = \`
						@keyframes hmr-pulse {
							0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; }
						}
						@keyframes hmr-success {
							0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); }
						}
					\`;
					document.head.appendChild(style);
					this.styleElement = style;
				}

				onBeforeUpdate() {
					this.log('🔥 HMR: Updating ${domain || "default"} domain...');
					if (this.enableVisualFeedback) {
						this.createIndicator('🔥 Updating...', '#ff6b35');
					}
				}

				onAfterUpdate() {
					this.log('✅ HMR: ${domain || "Default"} domain updated successfully');
					this.retryCount = 0;
					if (this.enableVisualFeedback && this.currentIndicator) {
						this.currentIndicator.style.background = '#28a745';
						this.currentIndicator.style.animation = 'hmr-success 0.5s ease';
						this.currentIndicator.textContent = '✅ Updated';
						setTimeout(() => this.removeIndicator(), ${config.hmr.indicatorDuration});
					}
				}

				onError(err) {
					this.error('❌ HMR Error in ${domain || "default"} domain:', err);
					if (this.enableVisualFeedback && this.currentIndicator) {
						this.currentIndicator.style.background = '#dc3545';
						this.currentIndicator.textContent = '❌ Error';
					}

					if (this.retryCount < this.maxRetries) {
						this.retryCount++;
						this.log(\`🔄 HMR: Retrying (\${this.retryCount}/\${this.maxRetries}) in ${config.hmr.retryDelay}ms...\`);
						
						if (this.enableVisualFeedback && this.currentIndicator) {
							this.currentIndicator.style.background = '#ffc107';
							this.currentIndicator.textContent = \`🔄 Retry \${this.retryCount}/\${this.maxRetries}\`;
						}

						setTimeout(() => window.location.reload(), this.retryDelay);
					} else {
						this.error('❌ HMR: Max retries exceeded. Manual refresh required.');
						if (this.enableVisualFeedback && this.currentIndicator) {
							this.currentIndicator.style.background = '#6f42c1';
							this.currentIndicator.textContent = '🔄 Refresh needed';
							this.currentIndicator.style.cursor = 'pointer';
							this.currentIndicator.onclick = () => window.location.reload();
						}
					}
				}
			}

			// Initialize HMR state
			const hmrState = new HMRState();
			
			// Accept hot updates for this module
			import.meta.hot.accept();
			
			// Set up event listeners
			import.meta.hot.on('vite:beforeUpdate', () => hmrState.onBeforeUpdate());
			import.meta.hot.on('vite:afterUpdate', () => hmrState.onAfterUpdate());
			import.meta.hot.on('vite:error', (err) => hmrState.onError(err));
			
			// Cleanup on module disposal
			import.meta.hot.dispose(() => {
				hmrState.log('🗑️ HMR: Cleaning up ${domain || "default"} domain module');
				hmrState.removeIndicator();
			});

			// Domain-specific logging
			${domain ? `console.log('🚀 HMR: Initialized for ${domain} domain (port: ${hmrPort})');` : ""}
		}
	`;
}
/**
 * Setup HMR for server-side usage (Node.js environment)
 */
export function setupServerHMR(domain) {
	if (!env.isDevelopment()) return;
	const port = domain ? config.hmr.ports[domain] : undefined;
	console.log(
		`🔥 HMR: Setting up server HMR for ${domain || "default"} domain${port ? ` (port: ${port})` : ""}`,
	);
	// Server-side HMR setup logic can be added here if needed
	return {
		domain,
		port,
		enabled: true,
	};
}
/**
 * Export configuration for external use
 */
export { config } from "./config";
export const hmrState = env.isDevelopment() ? new HMRState() : null;
