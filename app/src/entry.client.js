import { StrictMode, startTransition } from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

startTransition(() => {
	hydrateRoot(
		document,
		_jsx(StrictMode, {
			children: _jsx(HydratedRouter, {
				unstable_onError: (error, errorInfo) => {
					console.error(error, errorInfo);
					reportToErrorService(error, errorInfo);
				},
			}),
		}),
	);
});
function reportToErrorService(_error, _errorInfo) {
	throw new Error("Function not implemented.");
}
