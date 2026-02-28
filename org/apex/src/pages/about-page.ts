import { renderPageLayout } from './layout';

export const renderAboutPage = () =>
  renderPageLayout(
    'About - ORG',
    `
	<h1>About ORG Service</h1>
	<hr>
	<h2>Service Information</h2>
	<p><strong>Service Name:</strong> ORG</p>
	<p><strong>Description:</strong> Umaxica App Status Page - ORG Service</p>
	<p><strong>Runtime:</strong> Cloudflare Workers</p>
`,
  );
