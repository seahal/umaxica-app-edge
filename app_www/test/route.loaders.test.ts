import { describe, expect, it } from "bun:test";
import { CloudflareContext } from "../src/context";
import { loader as homeLoader, meta as homeMeta } from "../src/routes/_index";
import {
  loader as authenticationLoader,
  meta as authenticationMeta,
} from "../src/routes/authentication/_index";
import { loader as catchAllLoader, meta as catchAllMeta } from "../src/routes/catch-all";
import {
  loader as configurationLoader,
  meta as configurationMeta,
} from "../src/routes/configurations/_index";
import { loader as exploreLoader } from "../src/routes/explore/_index";
import { loader as healthLoader } from "../src/routes/healths/_index";
import { loader as messagesLoader } from "../src/routes/messages/_index";
import { loader as notificationsLoader } from "../src/routes/notifications/_index";

function createMockContext(env: Record<string, unknown>) {
  const contextMap = new Map();
  contextMap.set(CloudflareContext, {
    cloudflare: { env },
  });

  return {
    get: (key: symbol) => contextMap.get(key),
  };
}

async function runLoader<T extends (...args: unknown[]) => unknown>(
  loader: T,
  env: Record<string, unknown>,
) {
  const mockContext = createMockContext(env);
  const result = loader({
    context: mockContext,
    params: {},
    request: new Request("https://example.com"),
  } as Parameters<T>[0]);
  return await result;
}

describe("route loader coverage harness", () => {
  it("home loader returns empty message when VALUE_FROM_CLOUDFLARE is missing", async () => {
    const result = await runLoader(homeLoader, {});
    expect(result).toEqual({ message: "" });
  });

  it.each([
    ["home index", homeLoader, "VALUE_FROM_CLOUDFLARE"],
    ["authentication index", authenticationLoader, "VALUE_FROM_CLOUDFLARE"],
    ["configuration index", configurationLoader, "SECRET_SAMPLE"],
    ["explore index", exploreLoader, "VALUE_FROM_CLOUDFLARE"],
    ["health check", healthLoader, "VALUE_FROM_CLOUDFLARE"],
    ["messages index", messagesLoader, "VALUE_FROM_CLOUDFLARE"],
    ["notifications index", notificationsLoader, "VALUE_FROM_CLOUDFLARE"],
  ] as const)(
    "%s loader returns the expected Cloudflare-derived message",
    async (_, loader, envKey) => {
      const message = `test-message:${envKey}`;
      const result = await runLoader(loader, { [envKey]: message });
      expect(result).toEqual({ message });
    },
  );
});

describe("route meta implementations", () => {
  it("home meta advertises the Japanese homepage", () => {
    const [title, description] = homeMeta({
      params: {},
      request: new Request("https://example.com"),
      matches: [],
    });
    expect(title).toMatchObject({ title: "Umaxica - ホーム" });
    expect(description).toMatchObject({
      name: "description",
      content: "Umaxica - 今何してる？",
    });
  });

  it("authentication meta opts users into login copy", () => {
    const metaEntries = authenticationMeta({
      params: {},
      request: new Request("https://example.com/authentication"),
      matches: [],
    });
    expect(metaEntries).toContainEqual({
      title: "Umaxica - ログイン",
    });
    expect(metaEntries).toContainEqual({
      name: "description",
      content: "Umaxica にログインまたは新規登録",
    });
  });

  it("configuration meta highlights account settings", () => {
    const metaEntries = configurationMeta({
      params: {},
      request: new Request("https://example.com/configuration"),
      matches: [],
    });
    expect(metaEntries).toContainEqual({ title: "Umaxica - 設定" });
    expect(metaEntries).toContainEqual({
      name: "description",
      content: "アカウントと環境設定",
    });
  });

  it("catch-all meta discourages indexing of missing pages", () => {
    const metaEntries = catchAllMeta({
      params: {},
      request: new Request("https://example.com/missing"),
      matches: [],
    });
    expect(metaEntries).toContainEqual({
      title: "404 - ページが見つかりません",
    });
    expect(metaEntries).toContainEqual({
      name: "robots",
      content: "noindex, nofollow",
    });
  });
});

describe("catch-all loader", () => {
  it("throws a 404 response that explains the missing page", () => {
    expect.assertions(3);

    try {
      const mockContext = createMockContext({});
      catchAllLoader({
        context: mockContext,
        params: {},
        request: new Request("https://example.com/not-found"),
      } as Parameters<typeof catchAllLoader>[0]);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(404);
      expect(response.statusText).toBe("ページが見つかりません");
    }
  });
});
