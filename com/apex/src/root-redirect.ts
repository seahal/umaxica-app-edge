import { createRootRedirect } from '../../../shared/apex/root-redirect';

const { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload } =
  createRootRedirect('umaxica.com');

export { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload };
