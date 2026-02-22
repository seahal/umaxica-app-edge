export const renderHealthPage = (timestampIso: string) => `<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Health Check - ORG</title>
</head>
<body>
	<h1>Health Check</h1>
	<p>✓ OK</p>
	<p><strong>Service:</strong> ORG</p>
	<p><strong>Status:</strong> Running</p>
	<p><strong>Timestamp:</strong> ${timestampIso}</p>
</body>
</html>`;
