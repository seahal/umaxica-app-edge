import { StrictMode, startTransition } from 'react';
import type { ErrorInfo } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        {...({
          unstable_onError: (error: unknown, errorInfo: ErrorInfo) => {
            console.error(error, errorInfo);
          },
        } as Record<string, unknown>)}
      />
    </StrictMode>,
  );
});
