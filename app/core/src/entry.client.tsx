import * as Sentry from '@sentry/react-router';
import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

// サーバーから埋め込まれた環境変数を取得
declare global {
  interface Window {
    ENV: {
      SENTRY_DSN?: string;
    };
  }
}

// Sentry DSN が設定されている場合のみ初期化
if (window.ENV?.SENTRY_DSN) {
  Sentry.init({
    dsn: window.ENV.SENTRY_DSN,
    sendDefaultPii: true,
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
