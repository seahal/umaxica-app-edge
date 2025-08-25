import { startTransition, StrictMode, type ErrorInfo } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter
				unstable_onError={(error, errorInfo) => {
					console.error(error, errorInfo);
					reportToErrorService(error, errorInfo);
				}}
			/>
		</StrictMode>,
	);
});
function reportToErrorService(
	error: unknown,
	errorInfo: ErrorInfo | undefined,
) {
	throw new Error("Function not implemented.");
}
