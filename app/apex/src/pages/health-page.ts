export const renderHealthPage = (timestampIso: string) => `<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Health Check - APP</title>
</head>
<body>
	<p>✓ OK</p>
	<p><strong>Timestamp:</strong> ${timestampIso}</p>
</body>
</html>`;
