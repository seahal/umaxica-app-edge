if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js', { scope: '/', updateViaCache: 'none' })
    .catch(() => undefined);
}
