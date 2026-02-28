import { renderPageLayout } from './layout';

export const renderAboutPage = () =>
  renderPageLayout(
    'About - COM',
    `
	<h1>About COM Service</h1>
	<hr>
	<h2>Service Information</h2>
	<p><strong>Service Name:</strong> COM</p>
	<p><strong>Description:</strong> Umaxica App Status Page - COM Service</p>
`,
  );
