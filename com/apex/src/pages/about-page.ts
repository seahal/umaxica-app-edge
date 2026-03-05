import { renderPageLayout } from './layout';

export const renderAboutPage = () =>
  renderPageLayout(
    'About - COM',
    `
	<h2>About</h2>
	<p>For more information, please visit our main page.</p>
`,
  );
