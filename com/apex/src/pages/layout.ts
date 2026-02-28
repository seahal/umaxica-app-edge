import {
  COOKIE_CONSENT_BANNER_SCRIPT_PATH,
  CookieConsentBanner,
} from '../../../../shared/CookieConsentBanner';

export function renderPageLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
</head>
<body>
	<main>
${contentHtml}
	</main>
	${CookieConsentBanner()}
	<script src="${COOKIE_CONSENT_BANNER_SCRIPT_PATH}" defer></script>
</body>
</html>`;
}
