import { renderPageLayout } from './layout';

export const renderHealthPage = (timestampIso: string) =>
  renderPageLayout(
    'Health Check - COM',
    `
	<p>✓ OK</p>
	<p><strong>Timestamp:</strong> ${timestampIso}</p>
`,
  );
