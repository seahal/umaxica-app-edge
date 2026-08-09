# wrangler.jsonc から独自ドメイン指定を除去する

## Context

`wrangler.jsonc` に独自ドメイン (umaxica.com / .app / .org) が埋め込まれている箇所を、いったんすべて取り除きたい。

調査結果:

- **`routes` / `route` / `custom_domain` の項目は全 19 個の `wrangler.jsonc` に存在しない。** ドメイン割り当ては wrangler 設定ではなく Cloudflare ダッシュボード側で行われている。
- 独自ドメインが現れるのは **`env.*.vars.NEXT_PUBLIC_APP_URL` のみ**。Next.js 系 15 ワークスペース × 2 環境 (development / production) = 30 箇所。
  - development: `http://com.localhost:5102` 等
  - production: `https://umaxica.com`, `https://docs.umaxica.app` 等
- **このキーを参照しているアプリコードは存在しない。** `grep` でヒットするのは生成物の `*/core/cloudflare-env.d.ts` と `plans/`・`docs/` のドキュメントのみ。

方針 (ユーザー確認済み): `NEXT_PUBLIC_APP_URL` を development / production 両方から**全削除**する。

## Changes

### 1. 全 `wrangler.jsonc` から `NEXT_PUBLIC_APP_URL` 行を削除

対象は以下 15 ファイル (`*/apex` と `net/apex` は該当行なし・変更不要):

```
app/core  app/docs  app/news  app/help  app/info
com/core  com/docs  com/news  com/help  com/info
org/core  org/docs  org/news  org/help  org/info
```

各ファイルの `env.development.vars` と `env.production.vars` にある 1 行ずつを削除する。例 (`com/core/wrangler.jsonc`):

```jsonc
"vars": {
  "CLOUDFLARE_ENV": "production",
  "NODE_ENV": "production",
  "BRAND_NAME": "UMAXICA",
  "NEXT_PUBLIC_APP_URL": "https://umaxica.com"   // ← この行を削除
}
```

`NEXT_PUBLIC_APP_URL` は各 `vars` ブロックの最終要素なので、**直前の `"BRAND_NAME"` 行の末尾カンマも併せて削除**すること (JSONC でも trailing comma は wrangler に拒否されうるため)。

一括置換ではなく Edit で 1 ファイルずつ処理するのが安全 (development/production で値が異なるため、`replace_all` は使えない)。

### 2. `*/core/cloudflare-env.d.ts` の再生成

`app/core`, `com/core`, `org/core` の 3 ファイルに `NEXT_PUBLIC_APP_URL` の型が残る (12, 28, 39, 50 行目付近)。生成物なので手編集ではなく:

```
pnpm --filter <workspace> run cf-typegen
```

を 3 ワークスペースで実行して再生成する。50 行目の `Pick<Cloudflare.Env, ... | 'NEXT_PUBLIC_APP_URL'>` も自動で消えることを確認する。

`docs/*` `news/*` などには `cloudflare-env.d.ts` が無いため対応不要。

### 3. ドキュメントは対象外

`docs/operations/cloudflare-tunnel-development.md` と `plans/*.md` にも記述があるが、これらは記録文書なので今回は触らない (必要なら別途)。

## Verification

```
pnpm run format:check
pnpm run lint:check
pnpm run typecheck
pnpm run test
```

加えて:

- `grep -rn "umaxica\." --include=wrangler.jsonc .` が 0 件になること (`name` フィールドの `umaxica-apps-edge-*` はワーカー名なのでヒットしない)。
- `grep -rn "NEXT_PUBLIC_APP_URL" --include=wrangler.jsonc --include=cloudflare-env.d.ts .` が 0 件になること。
- 代表 1 ワークスペースで `pnpm --filter com/core run dev` 相当が設定パースエラーなく起動すること (JSONC 構文崩れの検知)。
