import { createApexApp } from '../../../shared/apex/create-apex-app';
import {
  buildRegionErrorPayload,
  getDefaultRedirectUrl,
  resolveRedirectUrl,
} from './root-redirect';
import { getAboutMeta, renderAboutContent } from './page-content';
import { renderer } from './renderer';

const app = createApexApp({
  rootHandler: 'redirect',
  rootRedirect: { resolveRedirectUrl, getDefaultRedirectUrl, buildRegionErrorPayload },
  getAboutMeta,
  renderAboutContent,
  renderer,
});

// Sentry: to re-enable, wrap app with Sentry.withSentry() and export the handler.
export default app;
