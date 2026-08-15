import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GlobalError from '../src/app/global-error';
import { ServiceWorkerRegistration } from '../src/components/service-worker-registration';

function clickButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (node) => node.textContent?.trim() === label,
  );
  expect(button).toBeTruthy();
  fireEvent.click(button as HTMLButtonElement);
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
  document.body.innerHTML = '';
});

describe('status surfaces', () => {
  it('renders global-error recovery UI', () => {
    const reset = vi.fn();
    const view = render(createElement(GlobalError, { error: new Error('boom'), reset }));
    clickButton(view.container, 'Try again');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();
  });

  it('registers the service worker and tolerates its absence', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    const ok = render(createElement(ServiceWorkerRegistration));
    await vi.waitFor(() =>
      expect(register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      }),
    );
    ok.unmount();

    delete (navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
    const missing = render(createElement(ServiceWorkerRegistration));
    missing.unmount();
  });
});
