import { createRootRedirect } from '../../../shared/apex/root-redirect';

const { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload } =
  createRootRedirect('umaxica.org');

export { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload };
