# development / test / production の3環境分離

## Context

Rails の `development` / `test` / `production` に相当する環境分離が、この monorepo には実質存在しない。

**現状の正確な把握（調査結果）:**

19個すべての `wrangler.jsonc` に `env.development` と `env.production` ブロックが定義されている。しかし——

1. **どのスクリプトも `--env` を渡していない。** `grep '\-\-env '` の一致は `--env-interface`（cf-typegen）のみ。したがって `wrangler deploy` / `wrangler dev` は常にトップレベル設定を使い、`env.*` ブロックは**一度も読まれていない死んだ設定**。`env.development.vars.CLOUDFLARE_ENV` も `NODE_ENV` も `BRAND_NAME` も適用されたことがない（apex は `keep_vars: true` なのでダッシュボード側の値が生きている）。
2. **dev と prod のブロックが内容的に同一。** 同じ KV namespace ID、同じ rate limiter `namespace_id`、同じ VPC `service_id`。`*/core` の2つの文字列 var 以外に差分がない。つまり仮に `--env` を効かせても分離にならない。
3. **CI にデプロイジョブが存在しない。** `.github/workflows/integration.yaml` は検証のみ（audit / knip / gitleaks / format / lint / check-workers / typecheck / test:cov / build マトリクス20件）。デプロイは完全に手元の手動実行。
4. **`routes` / `custom_domain` がどの設定にもない。** ドメイン割り当てはダッシュボード側で行われている。
5. **テストは環境という概念を持たない。** ルート `vitest.config.ts` 1枚が全ワークスペースを happy-dom で走らせる。`@cloudflare/vitest-pool-workers` は未導入で、テストは Workers ランタイムもバインディングも見ていない。

**目指す状態:** development（ローカル） / test（CI・ローカルのテスト実行専用、デプロイなし） / production（デプロイ先）の3層。staging は今回作らない。production の実リソースと worker 名は**一切変更しない**（変更リスクが高いため）。dev と test には新規リソースを作成する。

---

## 実装状況（2026-08-07 時点）

| Phase                          | 状態         | 備考                                                                                                                    |
| ------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1. production の worker 名固定 | **完了**     | 19件。あわせて apex 4件の `version_metadata` / `*/core` 3件の `images` 欠落を修正                                       |
| 2. `--env` の有効化            | **完了**     | 19ワークスペースのスクリプト                                                                                            |
| 3. dev / test のリソース分離   | **部分完了** | rate limiter は分離済（dev 2001–2004 / test 3001–3004）。KV・VPC は実リソースのためユーザーが注入する                   |
| 4. アプリコード                | **一部のみ** | `/health.json` に `environment` を追加（apex 4件）。`rails-client.ts` は Rails 側の構成が流動的なため**意図的に未着手** |
| 5. CI ガード                   | **完了**     | `tools/check-workers.mjs` に環境パリティ検査を追加                                                                      |

`env.test` ブロックは19件すべてに新設済み。test はデプロイされないため、KV / VPC service_id は暫定的に production と同じ値を指しており、該当箇所に `TODO` コメントを置いてある。

**既知の未解決（このタスクの範囲外）:** `pnpm run check:workers` と `pnpm run test:cov` は、本作業以前から working tree に存在する未コミット変更（content surface 12件への `vpc_services` 追加、`rails-client.ts` / playwright / sentry のカバレッジ不足）により失敗する。HEAD 版のチェッカーでも同一の失敗を再現確認済み。

---

## 調査レポート: Cloudflare / Vercel で3分岐は可能か

### 結論: 可能。ただし1点、致命的な移行リスクがある。

### Cloudflare Workers（Wrangler environments）

| 項目                            | 事実                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 環境の指定                      | `wrangler deploy --env production` / `wrangler dev --env development`。環境変数 `CLOUDFLARE_ENV=<name>` でも同じ効果         |
| **worker 名**                   | デフォルトで `<top-level name>-<env name>` になる。**`name` は inheritable キーなので env ブロック内で明示的に上書きできる** |
| 継承される（inheritable）       | `name`, `main`, `compatibility_date`, `compatibility_flags`, `routes`, `placement`, `observability`, `limits`, `assets`      |
| 継承されない（non-inheritable） | `vars`, `kv_namespaces`, `services`, `images`, および各種バインディング。**env ブロックに書かないと空になる**                |
| 環境別シークレット              | `.dev.vars.<environment-name>`（排他）または `.env.<environment-name>`（カスケード）                                         |

> **🚨 最大の移行リスク**
> deploy スクリプトに `--env production` を足すだけで、`name` を env ブロックに書かないと、19個の worker がすべて `umaxica-apps-edge-app-core-production` のような**新規 worker として作られ、現在稼働中の worker がカスタムドメインごと孤児化する**。
> 対策: `env.production` に `"name": "<現在のトップレベル name と同一>"` を明示する。これで production は今の worker をそのまま更新し続ける。

### OpenNext（`*/core`, `*/docs`, `*/news`, `*/help`, `*/info` の15件）

インストール済みの `@opennextjs/cloudflare@1.20.2` は `--env` をサポートする。`dist/cli/commands/utils/utils.js:139` に:

```js
...(args.env ? ["--env", args.env] : []),
```

`build` / `deploy` / `upload` / `preview` すべてに渡される。

[workers-sdk#11741](https://github.com/cloudflare/workers-sdk/issues/11741)（`--env` が無視される）は **pnpm の引数消費が原因**であり、OpenNext のバグではない。`pnpm run deploy --env=staging` と書くとフラグが npm ライフサイクルに吸われて届かない。→ **package.json のスクリプト本体に環境名を直書きする**（`deploy:production` のような固定スクリプトにする）ことで回避する。

### Vercel（`dev/acme`, `dev/apex`）

Vercel は Local / Preview / Production の3層をネイティブに持ち、Pro プランは Custom Environment を1プロジェクトにつき1つ追加できる（`vercel deploy --target=<slug>` / `vercel pull --environment=<slug>`）。

今回 test は**デプロイしない**方針なので、**Vercel 側は追加設定不要**。既存の Production（`vercel deploy --prod`）と Preview（PR 自動）がそのまま production / development 相当にマップされる。test は `NODE_ENV=test` 下のローカル実行に閉じる。

### test 層について

test はデプロイされないため、Cloudflare 上の実体は不要。必要なのは:

- テスト実行時に `NODE_ENV=test` が立つこと（現状 vitest はこれを設定するが、コード側は `NODE_ENV === 'development'` しか見ていない — `rails-client.ts` の分岐がテストで暗黙に「非 development」になっている）
- 将来 `@cloudflare/vitest-pool-workers` を入れたときに参照できる `env.test` ブロックが設定側に用意されていること

`env.test` は**ローカル/CI 専用の宣言**として置く。`wrangler dev --env test` や miniflare はローカルシミュレーションなので KV の実 ID を必要としない（`--remote` を付けない限り）。

---

## 実装計画

### Phase 1 — production を安全に固定する（最優先・単独でコミット可能）

**これを先に済ませないと、後続のどの変更も本番を壊しうる。**

19個すべての `wrangler.jsonc` の `env.production` ブロックに、トップレベルと同一の `name` を明示する。

```jsonc
// app/apex/wrangler.jsonc
"name": "umaxica-apps-edge-apex-app",
"env": {
  "production": {
    "name": "umaxica-apps-edge-apex-app",   // ← 追加。これがないと -production が付く
    ...
  }
}
```

対象（パターンは全件同一、代表例）:

- `app/apex/wrangler.jsonc`, `com/apex/wrangler.jsonc`, `org/apex/wrangler.jsonc`, `net/apex/wrangler.jsonc`
- `app/core/wrangler.jsonc` ほか `{app,com,org}/{core,docs,news,help,info}` の15件

**検証:** 各ワークスペースで `pnpm exec wrangler deploy --env production --dry-run` を実行し、出力の worker 名が現在の名前と一致することを目視確認する（デプロイはしない）。

### Phase 2 — `--env` を実際に効かせる

各 `package.json` のスクリプトを環境明示に書き換える。**フラグを CLI から渡さず、スクリプト本体に直書きする**（前述の pnpm 問題の回避）。

apex（Hono）4件:

```json
"dev":            "wrangler dev --config wrangler.jsonc --env development --port 5401 --ip 0.0.0.0",
"build":          "wrangler deploy --config wrangler.jsonc --env production --dry-run --outdir dist",
"deploy":         "wrangler deploy --config wrangler.jsonc --env production",
"deploy:upload":  "wrangler versions upload --config wrangler.jsonc --env production",
"deploy:promote": "wrangler versions deploy --config wrangler.jsonc --env production --yes"
```

OpenNext 15件:

```json
"build":          "opennextjs-cloudflare build --env production",
"deploy":         "opennextjs-cloudflare build --env production && opennextjs-cloudflare deploy --env production",
"deploy:upload":  "opennextjs-cloudflare build --env production && opennextjs-cloudflare upload --env production",
"deploy:promote": "wrangler versions deploy --env production --yes",
"preview":        "opennextjs-cloudflare build --env development && opennextjs-cloudflare preview --env development"
```

`*/core` の `dev` は `next dev` なので `--env` の対象外。ここは Next の `NODE_ENV=development` が自然に立つ。

> `--env` を付けた瞬間、`vars` が non-inheritable であるため **env ブロックに書かれた vars だけ**が有効になる。apex は `keep_vars: true` によりダッシュボード設定値が保持されるが、Phase 3 で env ブロック側を正とするか判断が要る。

### Phase 3 — dev / test に専用リソースを作る（production は触らない）

現在 dev と prod が共有している以下を、dev / test 用に**新規作成**する。production の ID は現状のまま一切変更しない。

| リソース                                  | 現状                                                       | 対応                                                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `BREAKER_KV` (KV namespace)               | dev/prod が同一 ID を共有（apex 4件、フレームごとに別 ID） | `wrangler kv namespace create` で dev 用・test 用を新規作成し、`env.development` / `env.test` に設定                        |
| `RATE_LIMITER` (`namespace_id` 1001–1004) | dev/prod が同一                                            | dev 用・test 用に別レンジを割り当て（例: dev 2001–2004、test 3001–3004）。rate limiter の namespace_id は設定上の自由な整数 |
| `UMAXICA_APPS_EDGE_CF_WORKERS_VPC`        | 全15ワークスペースが同一 `service_id`                      | Rails 側のバックエンドが分かれるかに依存する（下記「未解決」参照）                                                          |

`env.test` ブロックを19件すべてに新設する。内容は development と同形で、`CLOUDFLARE_ENV: "test"` / `NODE_ENV: "test"`、および test 用リソース ID。

### Phase 4 — アプリコードを環境非依存にする

`rails-client.ts`（15コピー、フレームごとに `RAILS_FRAME_PREFIX` のみ差分）の分岐:

```ts
// 現状 — バインディングが無いときの唯一のフォールバック条件
if (process.env.NODE_ENV === 'development') {
  return createRailsClient(createDevOnlyFetcher(), ...);
}
return null;
```

test 環境ではこれが `null` を返す。テストが Rails 到達をどう扱うべきかを明示する必要がある。**CLAUDE.md のフレーム重複ポリシーに従い、共有モジュールに切り出さず15コピーすべてを同じパターンで編集する。**

`*/apex/src/health-page.ts` の `HealthPayload` に環境名フィールド（`env.CLOUDFLARE_ENV` 由来）を足すと、デプロイ後にどの環境が動いているかを `/health.json` で外形確認できる。分離が正しく効いたことの検証手段として推奨。

### Phase 5 — 検証の自動化

`tools/check-workers.mjs` は既に `config.env` を走査している（`vpcBindings()` が `Object.values(config.env ?? {})` を回している）。ここに環境パリティ検査を追加する:

- 19件すべてが `development` / `test` / `production` の3ブロックを持つ
- `env.production.name` がトップレベル `name` と一致する（Phase 1 のリグレッション防止）
- `env.<name>.vars.CLOUDFLARE_ENV` が `<name>` と一致する
- development / test の KV ID・rate limiter namespace_id が production のものと**衝突しない**

CI（`.github/workflows/integration.yaml` の `check-workers` ジョブ）が既にこれを走らせているので、追加のワークフロー変更は不要。

---

## 未解決 — 実装前に判断が要る点

1. **Rails バックエンドは環境ごとに分かれるか。** `rails-client.ts` は `http://core.app.localhost:3000` を全環境ハードコードしており、VPC service が単一ホストで終端する前提になっている。dev/test 用の Rails 環境が別ホストにあるなら、VPC service を環境ごとに分けるか、ホスト名を env var 化する必要がある。**この repo の外（Rails 側）の構成に依存する。**
2. **apex の `keep_vars: true` をどうするか。** `--env` を効かせた後、`BRAND_NAME` の正をダッシュボードとするか設定ファイルとするか。設定ファイルを正とするなら `keep_vars` を外す判断が要る。

---

## 検証手順

```bash
pnpm install

# Phase 1 の安全確認（デプロイせず worker 名だけ確認）
pnpm -C app/apex exec wrangler deploy --env production --dry-run --outdir /tmp/dryrun
pnpm -C app/core exec wrangler deploy --env production --dry-run --outdir /tmp/dryrun
# → 出力の worker 名が umaxica-apps-edge-apex-app / umaxica-apps-edge-app-core であること

# 環境ごとの設定が実際に解決されるか
pnpm -C app/apex exec wrangler dev --env development --port 5401   # 起動して /health.json を叩く
pnpm -C app/apex exec wrangler dev --env test --port 5401

# 既存の検証一式（すべて通ること）
pnpm run check:workers
pnpm run format:check
pnpm run lint:check
pnpm run typecheck
pnpm run test
```

デプロイは Phase 1 と Phase 2 を1つずつ、まず `app/apex`（最も単純な Hono worker）だけで実施し、`/health.json` の `version` がデプロイ後に変わることと、カスタムドメインが維持されていることを確認してから残り18件に展開する。

---

**Sources:**

- [Wrangler Environments — Cloudflare Docs](https://developers.cloudflare.com/workers/wrangler/environments/)
- [Wrangler Configuration — Cloudflare Docs](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Environments — Vercel Docs](https://vercel.com/docs/deployments/environments)
- [cloudflare/workers-sdk#11741 — env flag not respected on opennextjs-cloudflare deploy](https://github.com/cloudflare/workers-sdk/issues/11741)
