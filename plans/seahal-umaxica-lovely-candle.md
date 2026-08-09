# Priority 1 (Rails ↔ Edge 接続) / Priority 2 (Cloudflare Access) 仕上げ

## Context

作業ツリーには大規模な進行中の変更がある。調査の結果、**Priority 1 / 2 の設計と実装そのものは既にほぼ完成している**ことが判明した。残っているのは「設計が正しく記録されておらず、コードと文書が矛盾している」ことによる不整合の解消と、環境分離の受け皿づくりである。

現在地（コードから確認した事実）:

- Rails への到達は **Cloudflare Workers VPC バインディング `UMAXICA_APPS_EDGE_CF_WORKERS_VPC`** 経由。`RAILS_API_URL` 方式は完全に撤去済み（リポジトリ全体で `RAILS_*` 環境変数は 0 件）。
- 責務が **Hono の `*/apex` から Next.js の 15 フレーム（`{app,com,org}` × `{core,docs,news,help,info}`）へ移管済み**。`*/apex/src/rails-client.ts` と `rails-health.ts` は削除され、apex には Rails 参照が 1 件も残っていない（grep で確認）。
- 15 個の `*/src/lib/rails-client.ts` は `RAILS_FRAME_PREFIX` 以外完全一致。規則は `/{frame}/{brand}`、hostname は 3 ブランドとも `core.app.localhost:3000`、timeout 5000ms、retry なし、`redirect: 'manual'`、`cache: 'no-store'`、`cookie`/`authorization`/`cf-access-client-*` を送信前に剥奪、VPC バインディング不在かつ非 development なら `null`（fail closed）。
- 疎通確認の窓口は各フレームの `/rails-health`（`src/app/rails-health/route.ts`）。Rails 側は `/health/liveness.json`。
- Cloudflare Tunnel は `compose.custom.yaml` に完成済み（バージョン固定・非特権・ポート非公開・トークン未設定でも落ちない）。`test/compose-tunnel-invariants.test.ts` が静的に強制。
- Cloudflare Access は**方針通りアプリに独自認証を実装していない**。Edge は Access サービストークンを一切保持せず、Cloudflare エッジで強制する設計。

解消すべき不整合:

1. `adr/001-rails-health-check.md` が全面的に陳腐化。`RAILS_API_URL`・`shared/apex/`（CLAUDE.md で禁止）・`vp check`/`vp test`（同じく禁止）に言及し、かつ `Status: Pending` と `Outcome: **Implemented.**` が矛盾。現行設計を記録した ADR が存在しない。
2. `docs/operations/cloudflare-tunnel-development.md:254-268` の Rails 疎通確認手順が `curl .../health.json | jq .rails` のままで、apex から `rails` フィールドが消えた今**動かない**。同 `:340` の `NEXT_PUBLIC_APP_URL` も撤去済みで陳腐化。
3. `wrangler.jsonc` の `vpc_services.service_id` が development と production で同一（`019f5fe0-287f-7040-9f2f-036cb5b21df7`）。意図的な共有なのか未分離なのかがコードから判別できない。
4. `README.md:190` は `JIT_{COM,ORG,APP}_{CORE,DOCS,NEWS,INFO,HELP}_URL` と書くが、`*/core/src/lib/jit-url.ts:2` の `JIT_WORKSPACES` に `INFO` が無い。
5. Cloudflare Access の手順が Tunnel 文書に埋もれており、Entra ID を IdP にする節が存在しない。

ゴール: 「どの環境で、どの hostname / endpoint を使うのか」がコードと文書から判別でき、環境を再分離する手順が一箇所に書かれ、テストで固定化された状態にする。

## 前提として明示する判断

ユーザーは「env 別 service_id の受け皿を今作る」を選択したが、**`env.production` にプレースホルダの偽 ID は書かない**。実 ID の発行は Cloudflare Dashboard 作業で、偽 ID を設定に置くと production デプロイが壊れるため。代わりに「受け皿」を、現在の共有状態を*明示的なアサーション*として固定し、分離時に一行差し替えで済む形＋テストが分離を検知する形で実装する。実 VPC サービスの作成は blocker として報告する。

## 実装

### 1. ADR 005 を新規作成（現行設計の記録）

`adr/005-rails-edge-workers-vpc-connection.md`

記録する内容:

- 決定: Rails への到達は Workers VPC バインディング 1 本。フレームの識別は **Host ではなくパス接頭辞** `/{frame}/{brand}`。
- エンドポイント表: 全 15 フレームの `RAILS_FRAME_PREFIX` 一覧、hostname `core.app.localhost:3000`、health は `/health/liveness.json`。
- 環境ごとの解決:
  - local development — VPC バインディングが解決すればそれを使用。不在時のみ `NODE_ENV === 'development'` で素の `fetch` にフォールバック（`app/core/src/lib/rails-client.ts:139-146`）。本番 Worker は `global_fetch_strictly_public` が有効なのでこの経路は成立しない、という安全性の根拠も明記。
  - production — VPC バインディングのみ。不在なら `null` を返し fail closed。
- 認証: Edge は資格情報を付与しない。Access サービストークンを持たない。境界は VPC サービスと Rails 側トンネル。
- timeout 5000ms / retry なし であることと、その理由（health は情報提供用、リトライは呼び出し側の責務）。
- **dev と production が同一 VPC サービスを共有していること**と、分離手順（Dashboard で 2 本目の VPC サービスを作り、各 `wrangler.jsonc` の `env.production.vpc_services[0].service_id` を差し替える。コード変更は不要）。
- ADR 001 を supersede する旨。

### 2. ADR 001 を Superseded にする

`adr/001-rails-health-check.md` の `## Status: Pending` を `## Status: Superseded by ADR 005` に変更し、冒頭に短い注記を追加（`RAILS_API_URL`・`shared/apex/` は現存せず、この文書は歴史的経緯としてのみ残す）。本文は書き換えない — ADR は追記型の記録であるため。

### 3. 運用文書の陳腐化した節を修正

`docs/operations/cloudflare-tunnel-development.md`

- `:254-268`「Verifying the Rails connection」を書き直す。`curl http://127.0.0.1:5101/health.json | jq .rails` → 各 Next.js フレームの `/rails-health`（例 `curl -s http://127.0.0.1:5102/rails-health | jq .rails`、ポートは `*/core` = 5102/5302/5402）。返る値は `ok` / `http-error` / `unreachable` / `not-configured` の 4 種で、`ok` 以外は 503 になることを明記。apex の `/health.json` はもう Rails を報告しない、と 1 行で理由を添える。
- `:340`（Re-splitting development and staging 手順内）の `NEXT_PUBLIC_APP_URL` への言及を、実際に使われている `JIT_{DOMAIN}_{WORKSPACE}_URL` 方式に差し替える。
- 同節に、VPC service_id の env 分離も staging 再分離時の手順として 1 項目追加する（ADR 005 へ参照）。

### 4. 接続不変条件のテストを追加

`test/rails-connection-invariants.test.ts`（新規）。既存の `test/compose-tunnel-invariants.test.ts` と同じスタイル — ファイルを直接読む静的検査で、コンテナ不要。

アサーション:

- 15 フレーム全てに `src/lib/rails-client.ts`・`src/lib/rails-health.ts`・`src/app/rails-health/route.ts` が実在する。
- 各 `rails-client.ts` の `RAILS_HOSTNAME` が全て同一、`RAILS_PORT` が `3000`、`RAILS_FETCH_TIMEOUT_MS` が全て同値。
- `RAILS_FRAME_PREFIX` が `/{frame}/{brand}` 規則に一致し、15 個が重複なく全て異なる。
- `*/apex/src/**` に `rails` / VPC バインディング名への参照が 1 件も無い（apex への逆流を防ぐ回帰ガード）。
- 全 16 `wrangler.jsonc` が `env.development` と `env.production` の**両方**に `vpc_services` を宣言している（wrangler はバインディングを env に継承しないため、片方の欠落は静かな本番障害になる）。
- **dev と prod の `service_id` が現在一致している**ことを明示的にアサートし、「意図的な共有。分離する際はこのテストと ADR 005 を同時に更新すること」というコメントを添える ← これが環境分離の受け皿。分離が無言で起きることを防ぎ、分離時の変更点を一箇所に集約する。

既存の `test/compose-tunnel-invariants.test.ts:162-179` は 15 コピーの存在と Access ヘッダ剥奪を既に担保しているので、そこは重複させない。

### 5. `jit-url.ts` に `INFO` を追加

`{app,com,org}/core/src/lib/jit-url.ts:2` の `JIT_WORKSPACES` に `'INFO'` を追加し、`README.md:190` の記述と一致させる。3 ファイルとも同一の変更。型の加算のみで、`test/coverage-boundaries.test.ts:38-45` は `'CORE'` しか使っていないため既存テストへの影響は無い。

### 6. Cloudflare Access の運用文書を新規作成（Priority 2）

`docs/operations/cloudflare-access.md`（新規）。依頼にある「Cloudflare 側 / Entra 側 / repository 側」の 3 分離をそのまま章立てにする。

- **現在地**: Access はアプリコードに一切実装されていない。これは欠落ではなく方針（Cloudflare エッジで強制し、アプリに独自認証を書かない）。リポジトリ内の唯一の Access 関連コードは `rails-client.ts` の `cf-access-client-*` ヘッダ剥奪という「送らない」側の防御。
- **repository 側で完了していること**: Tunnel コネクタ、`.env` によるトークン注入、`test/compose-tunnel-invariants.test.ts` による秘匿値の混入防止。追加のコード作業は無い。
- **Cloudflare 側で必要なこと（Dashboard 手動）**: Tunnel 文書 `:99-126` の Access アプリ／ポリシー手順をこちらへ集約し、Tunnel 文書からは参照に置き換える。禁止事項（Bypass / Everyone / `/api/*` 除外 / `/health` 無認証例外 / Service Auth）はそのまま維持。
- **Entra ID 側で必要なこと**: Entra を IdP にする場合の分離した手順 — Entra 管理者によるアプリ登録、リダイレクト URI（`https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`）、クライアント ID / シークレット、必要な Graph 権限、そして Cloudflare 側 Zero Trust → Settings → Authentication への OIDC/Entra ID IdP 追加。**Entra 側が未完成でも Access 自体は One-time PIN やメール許可リストで先に稼働できる**ことを明記し、依存を切り離す。
- **`docs`/`news`/`help`/`info` フレームが Access 保護対象外**である現状（Tunnel 文書 `:95-97`）と、追加する場合は Public Hostname エントリ＋Access アプリのみでコード変更不要であることを明記。

## Verification

```bash
pnpm install
pnpm run format:check
pnpm run lint:check
pnpm run typecheck
pnpm run test
```

加えて個別に:

```bash
pnpm exec vitest run test/rails-connection-invariants.test.ts
pnpm exec vitest run test/compose-tunnel-invariants.test.ts
pnpm exec vitest run test/coverage-boundaries.test.ts
```

新規テストが**現状の作業ツリーに対して通ること**を確認する。もし落ちたら、それはテストの誤りか実際の不整合のどちらかなので、切り分けて報告する（先に「失敗するはずのアサーション」を意図的に壊して検知能力を確認する）。

文書の手順は実行できる範囲で検証する: `/rails-health` の curl は Rails 側リポジトリとトンネルが無いローカルでは `not-configured` または `unreachable` を返すはずで、**その応答が返ること自体**（＝ルートが存在し 503 で応答する）を確認する。`ok` は Rails 側が必要なので blocker。

## この計画に含めないもの

- 15 コピーの `rails-client.ts` の共通化 — CLAUDE.md がフレーム間の重複を意図的なものとして明示的に禁止している。
- 未追跡ファイル群の `git add` / commit — 進行中作業の取り込み判断はユーザーの領分。
- `package.json` の `oxlint` 1.76.0 → 1.74.0 ダウングレードと `vitest` の `catalog:` 離脱 — 別作業の混入と思われるため、報告のみ行う。
- Priority 3 以降（SEAHAL サイト、AWS 静的配信）。

## Blockers（コードだけでは完結しない）

1. **Cloudflare Dashboard**: Access アプリ／ポリシーの作成、Tunnel の Public Hostname 登録。文書化はするが実行はできない。
2. **Cloudflare Dashboard**: production 用の 2 本目の VPC サービス作成（環境分離の実 ID）。
3. **Entra 管理者**: アプリ登録とクライアントシークレット発行。
4. **Rails リポジトリがローカルに存在しない**（`/home/edge/workspace` が唯一の git リポジトリ）。Rails 側の `/health/liveness.json` とパス接頭辞ルーティングの実在は Edge 側から確認できず、`ok` 応答での end-to-end 疎通確認は不可能。
