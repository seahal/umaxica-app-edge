import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ServiceWorkerRegistration } from '../src/components/service-worker-registration';

function removeServiceWorker() {
  delete (navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
}

describe('service worker registration', () => {
  it('registers the worker on supported browsers', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    expect(render(createElement(ServiceWorkerRegistration)).container.innerHTML).toBe('');
    await vi.waitFor(() =>
      expect(register).toHaveBeenCalledWith('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      }),
    );
  });

  it('tolerates unavailable workers and registration failures', () => {
    removeServiceWorker();
    expect(render(createElement(ServiceWorkerRegistration)).container.innerHTML).toBe('');

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register: vi.fn().mockRejectedValue(new Error('unsupported')) },
    });
    expect(render(createElement(ServiceWorkerRegistration)).container.innerHTML).toBe('');
  });
});
