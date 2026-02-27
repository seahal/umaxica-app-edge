import { StrictMode, startTransition } from 'react';
// oxlint-disable no-console
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
            reportToErrorService(error, errorInfo);
          },
        } as Record<string, unknown>)}
      />
    </StrictMode>,
  );
});

function reportToErrorService(_error: unknown, _errorInfo: ErrorInfo | undefined) {
  throw new Error('Function not implemented.');
}
