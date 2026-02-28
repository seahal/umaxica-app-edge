(() => {
  const BANNER_ID = 'jit-cookie-consent-banner';
  const ACCEPT_BUTTON_ID = 'jit-cookie-consent-accept';
  const CANCEL_BUTTON_ID = 'jit-cookie-consent-cancel';
  const COOKIE_NAME = 'jit_preference_consented';
  const DISMISSED_KEY = 'jit_cookie_banner_dismissed';

  const banner = document.getElementById(BANNER_ID);
  if (!banner) {
    return;
  }

  const acceptButton = document.getElementById(ACCEPT_BUTTON_ID);
  const cancelButton = document.getElementById(CANCEL_BUTTON_ID);
  if (
    !(acceptButton instanceof HTMLButtonElement) ||
    !(cancelButton instanceof HTMLButtonElement)
  ) {
    return;
  }

  const getCookie = (name) => {
    const encodedName = `${encodeURIComponent(name)}=`;
    const chunks = document.cookie.split(';');

    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (trimmed.startsWith(encodedName)) {
        return decodeURIComponent(trimmed.slice(encodedName.length));
      }
    }

    return null;
  };

  const parseConsentedCookie = (value) => {
    if (value === 'true' || value === '1') {
      return 'accepted';
    }

    if (value === 'false' || value === '0') {
      return 'denied';
    }

    return 'unknown';
  };

  const shouldShowCookieBanner = (state) => state !== 'accepted';

  const isDismissedForTab = () => {
    try {
      return sessionStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  };

  const dismissForTab = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Ignore session storage failures and still hide banner for current DOM state.
    }

    banner.hidden = true;
  };

  const setBusy = (busy) => {
    acceptButton.disabled = busy;
    cancelButton.disabled = busy;
    acceptButton.setAttribute('aria-busy', busy ? 'true' : 'false');
  };

  const acceptCookieConsent = async () => {
    const response = await fetch('/web/v1/cookie', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ consented: true }),
    });

    if (!response.ok) {
      throw new Error(`Cookie consent update failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.show_banner !== 'boolean'
    ) {
      throw new Error('Cookie consent response is invalid');
    }

    return payload;
  };

  const initialState = parseConsentedCookie(getCookie(COOKIE_NAME));
  banner.hidden = isDismissedForTab() || !shouldShowCookieBanner(initialState);

  cancelButton.addEventListener('click', () => {
    dismissForTab();
  });

  acceptButton.addEventListener('click', async () => {
    if (acceptButton.disabled) {
      return;
    }

    setBusy(true);

    try {
      const result = await acceptCookieConsent();
      if (result.show_banner === false) {
        dismissForTab();
      } else {
        banner.hidden = false;
      }
    } catch {
      banner.hidden = false;
    } finally {
      setBusy(false);
    }
  });
})();
