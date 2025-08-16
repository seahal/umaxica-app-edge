/**
 * Hot Module Replacement (HMR) client utilities for Hono + Vite
 */
export function createHMRScript() {
	return `
		// HMR Client Setup
		if (import.meta.hot) {
			import.meta.hot.accept();
			
			// Visual feedback for updates
			import.meta.hot.on('vite:beforeUpdate', () => {
				console.log('🔥 HMR: Updating...');
				// Add visual indicator
				const indicator = document.createElement('div');
				indicator.id = 'hmr-indicator';
				indicator.style.cssText = \`
					position: fixed;
					top: 10px;
					right: 10px;
					background: #ff6b35;
					color: white;
					padding: 8px 12px;
					border-radius: 4px;
					font-family: monospace;
					font-size: 12px;
					z-index: 9999;
					animation: pulse 1s infinite;
				\`;
				indicator.textContent = '🔥 Updating...';
				document.body.appendChild(indicator);
			});
			
			import.meta.hot.on('vite:afterUpdate', () => {
				console.log('✅ HMR: Updated successfully');
				// Remove indicator
				const indicator = document.getElementById('hmr-indicator');
				if (indicator) {
					indicator.style.background = '#28a745';
					indicator.textContent = '✅ Updated';
					setTimeout(() => indicator.remove(), 2000);
				}
			});
			
			import.meta.hot.on('vite:error', (err) => {
				console.error('❌ HMR Error:', err);
				const indicator = document.getElementById('hmr-indicator');
				if (indicator) {
					indicator.style.background = '#dc3545';
					indicator.textContent = '❌ Error';
				}
			});
			
			// Add pulse animation
			const style = document.createElement('style');
			style.textContent = \`
				@keyframes pulse {
					0% { opacity: 1; }
					50% { opacity: 0.5; }
					100% { opacity: 1; }
				}
			\`;
			document.head.appendChild(style);
		}
	`;
}
