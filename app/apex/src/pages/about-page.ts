import { renderPageLayout } from './layout';

export const renderAboutPage = () =>
  renderPageLayout(
    'About - APP',
    `
	<h1>About APP Service</h1>
	<hr/>
	<h2>Service Information</h2>
	<p><strong>Service Name:</strong> APP</p>
	<p><strong>Description:</strong> Umaxica App Status Page - APP Service</p>
`,
  );
