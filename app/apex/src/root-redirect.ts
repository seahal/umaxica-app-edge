import { createRootRedirect } from '../../../shared/apex/root-redirect';

const { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload } =
  createRootRedirect('umaxica.app');

export { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload };
