import { vi } from "vitest";

vi.mock("@sentry/react-router", () => ({
  init: () => {},
  captureException: () => {},
  captureMessage: () => {},
}));
