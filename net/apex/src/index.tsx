import { createApexApp } from '../../../shared/apex/create-apex-app';
import { getAboutMeta, getRootMeta, renderAboutContent, renderRootContent } from './page-content';
import { renderer } from './renderer';

const app = createApexApp({
  rootHandler: 'page',
  getRootMeta,
  renderRootContent,
  getAboutMeta,
  renderAboutContent,
  renderer,
});

// Sentry: to re-enable, wrap app with Sentry.withSentry() and export the handler.
export default app;
