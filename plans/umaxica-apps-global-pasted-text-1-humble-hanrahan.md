# Edge 開発環境の Cloudflare Tunnel + Access 化

## Context

現在 `umaxica-apps-edge` の開発サーバー（Next.js `*/core`、Hono `*/apex`）はコンテナ内の
ローカルポートでしか到達できない。これをデプロイ用 TLD 経由で外部からアクセス可能にし、
入口を Cloudflare Access の対話認証で保護したい。

隣接する `umaxica-apps-global`（Rails）は同じ課題をすでに解決済みで、cloudflared を
専用 Compose サイドカーとして運用している。その設計を Edge へ移植する。

現在の staging 環境は破壊してよいが、将来 development と staging を再分離するため、
コード上で両者を同一視してはならない。

---

## 1. 現状調査結果

### Edge リポジトリ

| 項目             | 現状                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| コンテナ         | `Dockerfile`（`node:24-trixie`, target `development`）+ `compose.yaml`（`core`, `postgres`）+ `.devcontainer/` あり                                                                             |
| rootless 対応    | `userns_mode: keep-id`、`DOCKER_UID/GID` build args、named volume 4本。`user:` 指定なし                                                                                                         |
| ポート公開       | `compose.yaml:29-41` で 12 ポート公開。devcontainer override は `ports: !override []`                                                                                                           |
| ネットワーク     | 明示定義なし＝プロジェクト既定ネットワーク。サービス名 `core` で名前解決可能                                                                                                                    |
| dev 起動         | **root の `dev` スクリプトが存在しない**。`pnpm --filter <ws> run dev` を個別実行                                                                                                               |
| バインドアドレス | `*/docs,news,help,info` は `--hostname 0.0.0.0`、`*/apex` は `--ip 0.0.0.0`。**`*/core` (`next dev --port 5102/5302/5402`) だけ 0.0.0.0 バインドが無く、コンテナ外から到達できない**            |
| staging          | **コード上に存在しない**。`staging` の grep ヒットは `*/apex/test/csrf.test.ts:15` のテスト名4件のみ。wrangler は全16ファイルが `env.development` / `env.production` の2環境だけ                |
| Rails 接続       | Cloudflare VPC Service バインディング `UMAXICA_APPS_EDGE_CF_WORKERS_VPC` 経由。`RAILS_BASE_URL` は存在しない（ADR-001 で廃止済み）                                                              |
| Access ヘッダー  | `*/core/src/lib/rails-client.ts:8-13` の `FORBIDDEN_REQUEST_HEADERS` が `cf-access-client-id` / `cf-access-client-secret` を除去。`*/core/test/lib/rails-client-factory.test.ts:103-117` で固定 |
| `.env`           | ファイル無し。`.gitignore:84` で `.env` は既に除外済み                                                                                                                                          |
| テスト           | root `vitest.config.ts` 単一。**coverage thresholds 100%**（`:34-39`）。include glob は `app                                                                                                    | com | dev | org | net | test/**` |

### 参考実装（`../umaxica-apps-global`）

cloudflared は **`compose.custom.yaml` の専用 Compose サービスのみ**。devcontainer 内プロセス、
supervisor、`Procfile.dev`、`bin/dev`、npm script のいずれにも存在しない。

```yaml
# compose.custom.yaml:10-24
services:
  cloudflare-tunnel:
    image: cloudflare/cloudflared:2025.7.0 # Workers VPC は 2025.7.0 以降が必須
    depends_on: [core]
    command: tunnel --protocol quic run # Workers VPC DNS routing に QUIC / UDP 7844 が必要
    environment:
      TUNNEL_TOKEN: '${CLOUDFLARED_TOKEN:?CLOUDFLARED_TOKEN must be set in .env}'
    networks: [frontend]
    extra_hosts: [host.docker.internal:host-gateway]
    restart: unless-stopped
```

補助設計:

- `.devcontainer/devcontainer.json:3` が `dockerComposeFile: [../compose.yaml, ./compose.override.yml, ../compose.custom.yaml]` で無条件 include（profile を使わず「merge に含めること自体が opt-in」）
- token は `.env` の `CLOUDFLARED_TOKEN` → コンテナ内 `TUNNEL_TOKEN`。**argv ではなく env**（プロセス一覧に出さないため）
- `docker/core/entrypoint.sh:36` と `.devcontainer/tailscale-core-login-environment.sh:17` の2箇所で `TUNNEL_TOKEN*` / `CLOUDFLARED_TOKEN*` をログイン環境からスクラブ
- `.devcontainer/write-host-ids.sh` が host の `UID`/`GID` のみを `.env` に追記（他の行を絶対に truncate しない旨をコメント明記）
- cloudflared に healthcheck は無く、`bin/tunnel-origin-check` が digest 固定の curl イメージを同一ネットワークで起動して origin 到達性を検証
- privileged / host network / cap_add / TUN / docker.sock は一切なし

### 流用可否の判定

| 参考実装の要素                                         | 判定                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| cloudflared を専用 Compose サービスにする              | **そのまま流用**（要件1が想定する設計。Edge の `core` は `sleep infinity` + 手動 pnpm 起動で、PID 1 も supervisor も持たないため、コンテナ内常駐は責務的に不適合） |
| `cloudflare/cloudflared:2025.7.0` タグ固定             | **そのまま流用**（要件8）                                                                                                                                          |
| `TUNNEL_TOKEN` env 注入 / `CLOUDFLARED_TOKEN` 命名     | **そのまま流用**（要件3の「既存命名規則を優先」）                                                                                                                  |
| `tunnel --protocol quic run`                           | **そのまま流用**（VPC バインディングを使い続けるため QUIC 必須）                                                                                                   |
| devcontainer.json の `dockerComposeFile` 配列 include  | **そのまま流用**                                                                                                                                                   |
| rootless 規約（keep-id、named volume、`user:` 非指定） | **そのまま流用**                                                                                                                                                   |
| `${CLOUDFLARED_TOKEN:?...}` のハード失敗               | **変更必須** — Compose 全体を落とし、要件3「Edge 開発サーバーは起動可能」と衝突。`:-` + 有限再起動 + 事前警告に置換                                                |
| `restart: unless-stopped`                              | **変更必須** — 要件7「有限またはバックオフ付きの再起動」。`on-failure:3` に置換                                                                                    |
| healthcheck 無し                                       | **変更必須** — 要件9。cloudflared の `--metrics` / `/ready` を有効化して段階的に判別                                                                               |
| `extra_hosts: host.docker.internal`                    | **流用しない** — Edge の origin は同一 Compose 内の `core` サービスであり、host gateway を経由する必要がない（不要な host 露出を避ける）                           |
| `docker/core/entrypoint.sh` の env スクラブ            | **流用しない** — Edge の `core` は entrypoint も root 起動もなく、`CLOUDFLARED_TOKEN` を `core` サービスに注入しないため、スクラブ対象がそもそも存在しない         |
| Tailscale サイドカー                                   | **流用しない** — Edge に Tailscale は不要。competing daemon なし                                                                                                   |
| Rails 側 `RAILS_BASE_URL` / Service Token              | **流用しない** — 下記「決定事項」参照                                                                                                                              |

---

## 2. 決定事項（ユーザー確認済み）

1. **Rails 接続は VPC バインディング維持**。`RAILS_BASE_URL` / `RAILS_ACCESS_CLIENT_ID` /
   `RAILS_ACCESS_CLIENT_SECRET` は導入しない。既存6コピーの `rails-client.ts` と
   `FORBIDDEN_REQUEST_HEADERS` テストを一切変更しない。
   → 要件6の「Access secret をクライアントへ露出させない」はより強く満たされる（Edge は
   Access secret を保持すらしない）。ブラウザ → Edge server → Rails の経路制約も既存のまま。
2. **Tunnel 公開範囲は 7 ホスト**: `{app,com,org}/apex`（5401/5101/5301）、
   `{app,com,org}/core`（5402/5102/5302）、`net/apex`（5201）。
   docs/news/help/info は将来追加（ingress 追加のみで済む）。
3. **Edge 専用 Tunnel を新規作成**。Rails Tunnel のトークンを流用しない
   （同一 Tunnel に2コネクターがぶら下がると Rails 向けトラフィックが Edge へ振られる）。
4. **`.env` は Edge に必要なキーのみ**。`.env.example` をコミットし、実 `.env` は
   `.gitignore:84` の既存ルールで除外済み。

---

## 3. Edge へ移植する設計

```
Browser
  │  Cloudflare Access（対話認証・許可メールのみ）
  ▼
Cloudflare Edge  ── 7 hostnames on the repurposed TLD
  │  Cloudflare Tunnel (QUIC / outbound UDP 7844)
  ▼
compose service: cloudflare-tunnel   [cloudflare/cloudflared:2025.7.0]
  │  ingress → http://core:<port>   （プロジェクト既定ネットワーク、サービス名解決）
  ▼
compose service: core  (devcontainer, sleep infinity)
  └─ pnpm run dev  →  Hono ×4 (wrangler dev) / Next.js ×3 (next dev)
        └─ Rails: env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC.fetch()  ← 既存のまま
```

Edge Compose と Rails Compose は共通ネットワークを持たず、Compose ファイルも統合しない。

### 環境分離

- アプリケーション環境は `development` のまま。`CLOUDFLARE_ENV=development` を維持。
- 公開ホスト名・Tunnel token は **`.env` の環境変数だけ**で注入し、コードは環境名で分岐しない。
- `if (environment === 'staging')` のような分岐は書かない。既存の
  `*/core/cloudflare-env.d.ts` の `'development' | 'production'` union も変更しない
  （staging を足すのは将来の再分離時の作業）。
- 将来 staging 復活時は「wrangler の `env.staging` ブロック追加 + 別 Tunnel + 別 Access
  アプリ + 別 `.env`」で完結し、アプリコードの変更は不要。

---

## 4. 変更対象ファイル

### 新規

| ファイル                                           | 内容                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compose.custom.yaml`                              | `cloudflare-tunnel` サービス。参考実装を基に、`TUNNEL_TOKEN: "${CLOUDFLARED_TOKEN:-}"`、`restart: on-failure:3`、`--metrics 0.0.0.0:2000` 付き `tunnel --protocol quic run`、`--no-autoupdate`、`depends_on: [core]`、`security_opt: [no-new-privileges:true]`、`read_only: true`。privileged / host network / cap_add / device なし。バージョン定数はこのファイル1箇所のみ |
| `.env.example`                                     | `CLOUDFLARED_TOKEN=`、`EDGE_PUBLIC_ORIGIN=`、`UID=`、`GID=` のテンプレート（値は空）                                                                                                                                                                                                                                                                                        |
| `bin/tunnel-status`                                | 4段階を判別する診断スクリプト（下記 §9）                                                                                                                                                                                                                                                                                                                                    |
| `bin/tunnel-warn`                                  | `CLOUDFLARED_TOKEN` 未設定を1回だけ警告して exit 0                                                                                                                                                                                                                                                                                                                          |
| `docs/operations/cloudflare-tunnel-development.md` | 要件10の全項目                                                                                                                                                                                                                                                                                                                                                              |
| `test/compose-tunnel-invariants.test.ts`           | 静的検証テスト（下記 §8）                                                                                                                                                                                                                                                                                                                                                   |

### 変更

| ファイル                                   | 変更点                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `.devcontainer/devcontainer.json:3`        | `dockerComposeFile` に `"../compose.custom.yaml"` を追加                                                                    |
| `.devcontainer/devcontainer.json:9`        | `runServices` に `"cloudflare-tunnel"` を追加（現状 `["core"]` のみのため、追加しないと起動しない）                         |
| `.devcontainer/devcontainer.json`          | `postStartCommand` に `bin/tunnel-warn` を追加                                                                              |
| `.devcontainer/devcontainer.json:16-18`    | `forwardPorts` が 5103/5104/5105 等の実在しないポートを指しているので、実ポート（5101/5102/5201/5301/5302/5401/5402）へ修正 |
| `compose.yaml:29-41`                       | apex 用ポート 5101/5201/5301/5401 を追加（tunnel 経由とは別に、ローカル直接確認用）。既存 12 ポートは維持                   |
| `{app,com,org}/core/package.json` の `dev` | `next dev --port N` → `next dev --hostname 0.0.0.0 --port N`。**これが無いと cloudflared から core へ到達できない**         |
| `package.json`                             | root `dev` スクリプトを追加（§7）。`test`/`lint` 等は変更しない                                                             |
| `.gitignore`                               | `.env` は既に除外済み。`!.env.example` の un-ignore 行を追加                                                                |
| `README.md`                                | Tunnel 開発手順への参照を追加                                                                                               |

### 変更しない（明示）

- `*/core/src/lib/rails-client.ts`、`*/apex/src/rails-client.ts`、`rails-health.ts`（全6+6コピー）
- `*/core/cloudflare-env.d.ts` の環境 union
- 全 16 `wrangler.jsonc`
- `vitest.config.ts`、`.oxlintrc.json`、`.oxfmtrc.json`、`tsconfig*.json`（CLAUDE.md により無断変更禁止）
- 作業ツリーの未コミット差分（`rails-health.ts` の `invalid-path` 対応など）には触れない

---

## 5. 削除・破壊する staging 設定

**該当なし。** 調査の結果、このリポジトリに staging 固有の設定は存在しなかった:

- `wrangler.jsonc` 全16ファイルが `env.development` / `env.production` のみ
- `staging` の grep ヒットは `{app,com,net,org}/apex/test/csrf.test.ts:15` のテスト名文字列4件のみ
  （`workers.dev` プレビューオリジンの許可テストであり、環境定義ではないため残す）
- staging 用のデプロイスクリプト、ルート、環境変数は無い

したがって「デプロイ用 TLD を development へ流用する」作業は、Cloudflare Dashboard 側の
DNS / Tunnel / Access 設定の付け替えのみで完結する。リポジトリ側で破壊するものは無い。
この事実をドキュメントに明記する。

---

## 6. セキュリティ境界

| 境界                         | 制御                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| インターネット → Edge ホスト | **Cloudflare Access（対話認証）**。7ホストすべてを `/*` で保護。Bypass+Everyone 禁止、`/api/*` や `/health` の除外を作らない                        |
| Cloudflare Edge → ローカル   | Cloudflare Tunnel（outbound QUIC のみ。inbound ポート開放なし）                                                                                     |
| cloudflared コンテナ         | rootless、`no-new-privileges`、`read_only`、privileged/host network/cap_add/device なし、docker.sock 非マウント                                     |
| token                        | `.env`（gitignore 済み）→ compose `environment` → コンテナ内 `TUNNEL_TOKEN`。argv に出さない。イメージに焼き込まない。`core` サービスには注入しない |
| Edge → Rails                 | Cloudflare VPC Service バインディング（Edge は Access secret を保持しない）。`cf-access-*` ヘッダーは `FORBIDDEN_REQUEST_HEADERS` で除去済み        |
| クライアントバンドル         | `NEXT_PUBLIC_*` / `VITE_*` に token / secret を一切置かない。静的テストで機械的に検証                                                               |

`/health` の扱い: `*/apex` の `/health` は Access の内側に置く（無認証公開しない）。
外部からの無認証 healthcheck は作成しない。到達性確認は `bin/tunnel-status` が
コンテナ内部から行う。

---

## 7. 起動と停止

root `package.json` に追加:

```jsonc
"dev": "pnpm --parallel --filter ./com/apex --filter ./com/core --filter ./org/apex --filter ./org/core --filter ./app/apex --filter ./app/core --filter ./net/apex run dev"
```

- devcontainer を開くと `core` と `cloudflare-tunnel` が同時に起動する（`runServices`）。
- 開発者は `pnpm run dev` の1コマンドで 7 サーバーを起動する。
- cloudflared は独立サービスなので、落ちても `pnpm run dev` には一切影響しない。
- 停止: devcontainer を閉じる（`shutdownAction: stopCompose`）か
  `podman compose -f compose.yaml -f .devcontainer/compose.override.yml -f compose.custom.yaml down`。
- cloudflared だけ停止: `podman compose ... stop cloudflare-tunnel`。

**token 未設定時の挙動**（要件3の推奨どおり）:

- `TUNNEL_TOKEN: "${CLOUDFLARED_TOKEN:-}"` — Compose 全体は正常に起動する。
- `bin/tunnel-warn`（postStartCommand）が未設定を **1回だけ** 警告して exit 0。
- cloudflared 自身は token 無しで起動失敗するが、`restart: on-failure:3` により
  3回で停止し、無限再起動しない。
- `core` と `pnpm run dev` は無傷。`depends_on` は cloudflared → core の一方向のみ。
- SIGTERM で graceful shutdown（`init: true` 相当は cloudflared 自身が処理）。

---

## 8. Cloudflare Dashboard で必要な手動作業（ドキュメントに正確な手順として記録）

1. **Tunnel 作成** — Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared。
   名前は `umaxica-apps-edge-development`。Rails の Tunnel とは別物として新規作成する。
   発行されたコネクタートークンを Edge リポジトリ root の `.env` の `CLOUDFLARED_TOKEN` に設定。
2. **Public Hostname 登録**（Tunnel の Public Hostname タブ、7件）—
   各ホスト名 → Service `HTTP` → URL `core:<port>`。
   割当は `apex→5101/5201/5301/5401`、`core→5102/5302/5402`。
   ホスト名は流用するデプロイ用 TLD 上のサブドメインを使う。DNS レコードは Tunnel が自動作成。
3. **Access Application 作成** — Zero Trust → Access → Applications → Add → Self-hosted。
   7 ホストそれぞれに `Domain = <host>`, `Path = 空（= /*）`。
   （1アプリに複数ドメインを登録できる場合は1アプリにまとめてよい。）
4. **Access Policy** — Action `Allow`、Include は
   `Emails` に管理者本人のアドレス（または `Emails ending in` で組織ドメイン）のみ。
   Bypass / Everyone / Service Auth のポリシーは作らない。
5. **セッション** — Session Duration は既定（24h 程度）。App Launcher 表示は任意。
6. **確認** — 未認証ブラウザで各ホストへアクセスし、Access のログイン画面が出ることを確認。
7. **egress 要件** — 開発環境から **outbound UDP 7844** が出られること（QUIC）。
   塞がれている場合のみ `--protocol http2` へフォールバック（ドキュメントに併記）。

Rails 側の Tunnel / Access / VPC Service は既に完成済みであり、今回は一切変更しない。

---

## 9. healthcheck / 状態判別

`bin/tunnel-status` が 4 段階を区別して出力する:

| 段階                                | 判定方法                                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Edge 開発サーバーが起動している     | `core` コンテナ内から各ポートへ `curl -sf http://127.0.0.1:<port>/health`                                                                    |
| cloudflared プロセスが起動している  | `podman compose ... ps -q cloudflare-tunnel` が非空、かつ State が running                                                                   |
| Tunnel が Cloudflare に接続している | cloudflared の `--metrics 0.0.0.0:2000` を有効化し、`core` から `curl -sf http://cloudflare-tunnel:2000/ready`。200 と接続数が返れば接続確立 |
| 外部ホストから Edge へ到達できる    | Access 保護下のため自動確認しない。ブラウザで対話認証して手動確認する旨を出力                                                                |

metrics ポート 2000 は Compose 内部ネットワークのみ（`ports:` で公開しない）。
Compose の `healthcheck:` は cloudflared イメージに shell が無いため付けない
（参考実装と同じ判断。判定は `bin/tunnel-status` が外部から担う）。

---

## 10. テスト計画

### 静的検証（`test/compose-tunnel-invariants.test.ts` + コマンド）

- `podman compose -f compose.yaml -f .devcontainer/compose.override.yml -f compose.custom.yaml config` が成功する（構文検証）
- 上記 `config` 出力に `privileged: true` / `network_mode: host` / `/var/run/docker.sock` / `cap_add` が含まれない
- cloudflared の image が `:latest` でなく、明示バージョンタグである
- `CLOUDFLARED_TOKEN` 未設定でも `config` と `up` が成功する
- `git check-ignore .env` が成功し、`git ls-files` に `.env` が含まれない
- リポジトリ全体で `NEXT_PUBLIC_*` / `VITE_*` の名前に `TOKEN` / `SECRET` / `ACCESS` を含む変数が存在しない
- `staging` が wrangler 設定・ソースの環境分岐に登場しない（テスト名文字列4件は許可リスト）
- 既存の `pnpm run format:check` / `lint:check` / `typecheck` / `test` / `check:workers` が通る

vitest の coverage threshold 100% を壊さないよう、新規テストは `test/` 配下に置き、
`bin/` の shell スクリプトは include glob 外であることを確認する。

### ローカル検証

1. `CLOUDFLARED_TOKEN` 未設定で devcontainer を起動 → `core` 正常、警告1回、
   cloudflared は3回で停止、`pnpm run dev` で7サーバーが起動する
2. token 設定 → cloudflared が接続、`bin/tunnel-status` が全段階 OK
3. `podman compose stop cloudflare-tunnel` → dev サーバーが生存し続ける
4. `podman compose restart cloudflare-tunnel` → 再接続する
5. `podman compose down && up` → 設定が再現される
6. `podman compose logs -f cloudflare-tunnel` から接続状態が読める
7. `curl http://127.0.0.1:5101/health` 等でローカル直接到達を確認

### 外部疎通（Dashboard 設定完了後、自分の所有ホストに対してのみ）

1. 未認証ブラウザ（プライベートウィンドウ）で 7 ホストへ → Access ログインへリダイレクトされる
2. 許可メールで認証 → Edge のページが表示される
3. 許可外アカウントで認証 → 拒否される
4. `/health` と `/api/*` も同様に Access で保護されている（例外が無い）ことを確認
5. Edge の `/health` レスポンスの `rails` フィールドが `ok` で、VPC バインディング経由の
   Rails 到達が生きていることを確認
6. ブラウザの DevTools（Network / ソース）で Rails の Access secret が露出しないことを確認
   — 実際には Edge が secret を保持しないので、`cf-access` を含むヘッダー/文字列が
   クライアントバンドルに無いことを確認する
7. Rails 停止時に Edge の `/health` が制御されたエラー（503 + `rails.kind`）を返すことを確認

攻撃的な試験は行わない。正常系と拒否系の確認のみ。

---

## 11. ロールバック方法

1. `.devcontainer/devcontainer.json` の `dockerComposeFile` から `../compose.custom.yaml` を、
   `runServices` から `cloudflare-tunnel` を削除して devcontainer を再ビルド
   → cloudflared は起動しなくなり、他は現状のまま
2. `.env` の `CLOUDFLARED_TOKEN` を空にする → cloudflared だけが無効化される（最速）
3. Cloudflare Dashboard で Tunnel を削除、Access Application を削除
4. `git revert` — アプリコード（`rails-client` / wrangler / 環境 union）に手を入れないため、
   revert しても既存の開発・本番動作に影響しない

---

## 12. secrets のローテーション

1. Zero Trust → Networks → Tunnels → 該当 Tunnel → Refresh token
2. root `.env` の `CLOUDFLARED_TOKEN` を差し替え
3. `podman compose ... up -d --force-recreate cloudflare-tunnel`
4. `bin/tunnel-status` で再接続を確認
5. `core` サーバーの再起動は不要（token を注入していないため）

---

## 13. 将来 development と staging を再分離する手順

1. staging 用に **別の** Tunnel を作成し、別 TLD/サブドメインへ Public Hostname を登録
2. staging 用 Access Application を作成（development とは別ポリシー）
3. 全 `wrangler.jsonc` に `env.staging` ブロックを追加し、
   `CLOUDFLARE_ENV=staging` / `NEXT_PUBLIC_APP_URL` を設定
4. `*/core/cloudflare-env.d.ts` の union に `'staging'` を追加
5. development 用 `.env` はそのまま。staging はデプロイ側の環境変数で注入

この手順のどれも、今回追加するコードの分岐変更を必要としない
（今回のコードには環境名による分岐が存在しないため）。

---

## 14. 未確定事項

- 流用するデプロイ用 TLD の実際のドメイン名 — 実装ではハードコードせず `.env.example` の
  プレースホルダと Dashboard 手順で扱う。値の記録は利用者が `.env` に入れる。
- `wrangler dev` がコンテナ内でリモート VPC バインディングを解決できるか（要ローカル検証）。
  解決できない場合、apex の `/health` は `rails.kind: not-configured` を返すが、
  Tunnel / Access の検証自体は成立する。この結果はローカル検証 5 で判明する。
- outbound UDP 7844 が開発ネットワークで通るか（通らなければ `--protocol http2`）。
