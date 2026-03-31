# React Router v7 ルートインベントリ

Next.js 移行の参照資料として、各 core ワークスペースの全ルート構成を記録する。
調査日: 2026-03-31

---

## 共通パターン

全ワークスペースに共通する構成:

- **Root (`root.tsx`)**: CSP nonce 生成、Cloudflare 環境変数の読み込み、ErrorBoundary (404/503/500)、i18next ミドルウェア
- **Decorated レイアウト**: Header + Footer を含むラッパー。主要ページはこの中にネスト
- **`/health`**: JSON ヘルスチェック (`{ status, timestamp }`)。`X-Robots-Tag: noindex, nofollow`
- **`/sentry`** / **`/about`**: Sentry DSN 検証用の意図的エラールート
- **`/*` (catch-all)**: 404 レスポンスを throw → NotFoundPage 表示
- **Loader パターン**: `getEnv(context)` で Cloudflare env にアクセス
- **Action**: 全ワークスペースとも POST/PUT/DELETE アクションなし（読み取り専用）

---

## com/core (umaxica.com — コーポレートサイト)

| パス       | ファイル                    | Loader       | 概要                                                                                                  |
| ---------- | --------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `/`        | `routes/_index.tsx`         | Yes          | コーポレートトップ。モジュラープラットフォーム紹介、Vision/Platform/Practice タブ、問い合わせフォーム |
| `/explore` | `routes/explore/_index.tsx` | Yes          | 検索・発見ページ。プロダクト/人材/シグナル/プレイブック横断検索。handle: `{ breadcrumb: "Explore" }`  |
| `/about`   | `routes/about.tsx`          | Yes (throws) | Sentry テスト用                                                                                       |
| `/sentry`  | `routes/sentry.tsx`         | Yes (throws) | Sentry テスト用                                                                                       |
| `/health`  | `routes/health.tsx`         | Yes          | ヘルスチェック (JSON)                                                                                 |
| `/*`       | `routes/catch-all.tsx`      | Yes (404)    | 404 ページ                                                                                            |

**レイアウト構造:**

```
root
├── /health (decorated レイアウト外)
├── /sentry (decorated レイアウト外)
└── decorated (Header + Footer)
    ├── / (_index)
    ├── /explore
    ├── /about
    └── /* (catch-all)
```

---

## app/core (umaxica.app — サービスサイト)

| パス                        | ファイル                               | Loader       | 概要                                                                            |
| --------------------------- | -------------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `/`                         | `routes/_index.tsx`                    | Yes          | ホーム。Timeline コンポーネント表示                                             |
| `/authentication`           | `routes/authentication/_index.tsx`     | Yes          | 認証ページ。外部 auth.umaxica.app への接続案内                                  |
| `/configuration`            | `routes/configurations/_index.tsx`     | Yes          | 設定トップ。Account / Preference へのメニュー。SECRET_SAMPLE 表示               |
| `/configuration/account`    | `routes/configurations/account.tsx`    | No           | アカウント設定。メール、リージョン選択、アカウント削除                          |
| `/configuration/preference` | `routes/configurations/preference.tsx` | No           | ユーザー設定。ダークモード、ハイコントラスト、言語、タイムゾーン、reduce-motion |
| `/explore`                  | `routes/explore/_index.tsx`            | Yes          | 検索ページ。All/Users/Posts/Trends タブ                                         |
| `/messages`                 | `routes/messages/_index.tsx`           | Yes          | メッセージ (工事中)                                                             |
| `/notifications`            | `routes/notifications/_index.tsx`      | Yes          | 通知 (工事中)                                                                   |
| `/about`                    | `routes/about.tsx`                     | Yes (throws) | Sentry テスト用                                                                 |
| `/sentry`                   | `routes/sentry.tsx`                    | Yes (throws) | Sentry テスト用                                                                 |
| `/health`                   | `routes/health.tsx`                    | Yes          | ヘルスチェック (JSON)                                                           |
| `/*`                        | `routes/catch-all.tsx`                 | Yes (404)    | 404 ページ                                                                      |

**レイアウト構造:**

```
root
├── /health
├── /sentry
├── /about
└── decorated (Header + Footer) ※要確認
    ├── /
    ├── /authentication
    ├── /configuration
    │   ├── /configuration/account
    │   └── /configuration/preference
    ├── /explore
    ├── /messages
    ├── /notifications
    └── /* (catch-all)
```

**注目点:**

- `/authentication` — 外部認証サービス連携あり
- `/configuration/*` — ネストされた設定ページ群
- `/messages`, `/notifications` — UI 未完成（工事中）

---

## org/core (umaxica.org — スタッフサイト)

| パス         | ファイル               | Loader       | 概要                                                                                          |
| ------------ | ---------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `/`          | `routes/_index.tsx`    | Yes          | トップ。EventList コンポーネント（ワークショップ/カンファレンス/ミートアップ/ウェビナー一覧） |
| `/configure` | `routes/configure.tsx` | Yes          | 設定ページ。アカウント管理・プリファレンスのプレースホルダー                                  |
| `/sample`    | `routes/sample.tsx`    | No           | サンプルページ。組織サイトの説明                                                              |
| `/sentry`    | `routes/sentry.tsx`    | Yes (throws) | Sentry テスト用                                                                               |
| `/health`    | `routes/health.tsx`    | Yes          | ヘルスチェック (JSON)                                                                         |
| `/*`         | `routes/catch-all.tsx` | Yes (404)    | 404 ページ                                                                                    |

**レイアウト構造:**

```
root
├── /health (decorated レイアウト外)
├── /sentry (decorated レイアウト外)
└── decorated (Header + Footer)
    ├── /
    ├── /configure
    ├── /sample
    └── /* (catch-all)
```

**環境変数:** `BRAND_NAME`, `VALUE_FROM_CLOUDFLARE`, `DOCS_STAFF_URL`, `HELP_STAFF_URL`, `NEWS_STAFF_URL`

---

## dev/core (umaxica.dev — 開発者ステータス / Vercel デプロイ)

| パス      | ファイル               | Loader       | 概要                                                                                            |
| --------- | ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `/`       | `routes/home.tsx`      | Yes          | DocsViewer コンポーネント。React Aria Components ドキュメント閲覧（検索・タブ・ナビゲーション） |
| `/about`  | `routes/about.tsx`     | Yes (throws) | Sentry テスト用                                                                                 |
| `/health` | `routes/health.tsx`    | Yes          | ヘルスチェック (JSON)                                                                           |
| `/*`      | `routes/catch-all.tsx` | Yes (404)    | 404 ページ                                                                                      |

**レイアウト構造:**

```
root
└── decorated (Header + Footer)
    ├── / (home)
    ├── /about
    ├── /health
    └── /* (catch-all)
```

**注目点:**

- Vercel デプロイ（他は Cloudflare Workers）
- Vercel Speed Insights 統合
- 全ルートが decorated レイアウト内

---

## 共有インフラ (shared/)

### Worker エントリポイント (`*/core/workers/app.ts`)

全ワークスペース共通のパターン:

1. `createRequestHandler()` で React Router v7 のサーバービルドを読み込み
2. CSP nonce を生成し `RouterContextProvider` 経由で注入
3. `checkRateLimit()` でレート制限チェック（shared/apex）
4. `withResolvedSecretValue()` で Sentry DSN を Cloudflare Secrets Store から解決

### Apex ミドルウェアチェーン (`shared/apex/create-apex-app.tsx`)

バックエンド (\*/apex) で適用される順序:

1. `etagMiddleware()` — ETag キャッシュ
2. `rateLimitMiddleware()` — IP ベースレート制限 (429)
3. `apexCsrfMiddleware()` — CSRF 保護（オリジン検証）
4. `securityHeadersMiddleware()` — CSP, HSTS, X-Frame-Options 等
5. `i18nMiddleware()` — 言語検出 (en/ja)

### CSRF 許可オリジン (`shared/apex/middleware/csrf.ts`)

- 本番: `https://*.umaxica.{com|org|app|net}`
- ローカル: `http://{com|org|app|net}.localhost`
- プレビュー: `https://*.workers.dev`

### ルートリダイレクト (`shared/apex/root-redirect.ts`)

- `createRootRedirect(siteUrl)` ファクトリ
- リージョンパラメータ: `?ri=jp` or `?ri=us`
- フォールバック: jp → `https://jp.umaxica.app/`

### CloudflareContext (`*/core/src/context.ts`)

```typescript
interface CloudflareContextValue {
  cloudflare?: { env?: Env; ctx?: ExecutionContext };
  security?: { nonce?: string };
}
```

- `getEnv(context)` — Cloudflare 環境変数アクセス
- `getNonce(context)` — CSP nonce 取得

### セキュリティヘッダー (`shared/apex/middleware/security-headers.ts`)

- HSTS (preload)、CSP (no inline scripts)、X-Frame-Options: DENY、Referrer-Policy: no-referrer
- 400/404 レスポンスではスキップ

---

## Next.js 移行時の考慮事項

### Loader → Server Component / Route Handler

- 各ルートの `loader` は Next.js の Server Component データ取得 or `route.ts` に対応
- `/health` は Next.js Route Handler (`app/health/route.ts`) に移行が自然

### レイアウト

- `decorated.tsx` → Next.js の `layout.tsx` (Header + Footer)
- `root.tsx` → `app/layout.tsx` (RootLayout)

### エラーハンドリング

- React Router の ErrorBoundary → Next.js の `error.tsx` / `not-found.tsx`
- catch-all 404 → `app/not-found.tsx`

### 環境変数

- Cloudflare `getEnv(context)` → Next.js `process.env` / Cloudflare Workers 対応が必要

### ミドルウェア

- CSP nonce 生成 → Next.js `middleware.ts`
- i18next → next-intl or next-i18next

### 未完成機能

- `app/core`: `/messages`, `/notifications` は工事中
- `org/core`: `/configure` はプレースホルダー状態
