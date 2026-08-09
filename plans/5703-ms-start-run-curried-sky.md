# devcontainer のビルドが落ちる問題の修正

## Context

`devcontainer up` が `podman compose ... build --no-cache core cloudflare-tunnel` の段階で失敗する。

```
ERRO Can't add file .../.ai/context/architecture.md to tar: io: read/write on closed pipe
failed to connect to the docker API at unix:///run/user/1000/podman/podman.sock
```

エラーの読み順が誤解を招くが、根本原因はソケットではない。

- `systemctl --user status podman.socket` は **active (listening)**、`podman info` も
  `RemoteSocket.Exists = true` を返す。ソケット自体は生きている。
- 実際に起きているのは **ビルドコンテキストの tar 転送中に接続が切れている**こと。
  `Can't add file ... to tar: read/write on closed pipe` が先に出て、その後
  「接続できない」と報告される順序になっている。

なぜ転送が破綻するか:

| 項目                                                      | 実測                   |
| --------------------------------------------------------- | ---------------------- |
| ビルドコンテキスト (`compose.yaml` の `build.context: .`) | **4.8 GB**             |
| うち `.pnpm-store/`                                       | 3.9 GB                 |
| うち `node_modules/`                                      | 597 MB                 |
| `.dockerignore` / `.containerignore`                      | **どちらも存在しない** |

さらに決定的なのは、`Dockerfile` に **`COPY` / `ADD` が 1 つも無い**こと
(`grep -n '^(COPY|ADD)' Dockerfile` → 0 件)。ワークスペースは compose の
bind mount で入るので、4.8 GB は完全に無駄に転送されている。これを削れば
ビルドは数秒で通る。

## 変更内容

### 1. `.dockerignore` を新規作成（本丸）

リポジトリルートに追加する。podman / docker-compose plugin のどちらも読む。
bind mount には一切影響しないので、実行時のワークスペース内容は変わらない。

```
# Dockerfile には COPY/ADD が無く、ワークスペースは compose の bind mount で
# 入る。ここで重量物を落とすのは純粋な転送量削減であり、コンテナ内から見える
# ファイルには影響しない。将来 COPY を足すときはこの一覧を見直すこと。
.git
node_modules
**/node_modules
.pnpm-store
coverage
.next
**/.next
.open-next
**/.open-next
.wrangler
**/.wrangler
.idea
.claude
.aiassistant
plans
*.log
```

`*`（全除外）ではなく明示列挙にする理由: 後から `COPY` が追加されたときに
サイレントに壊れないため。

### 2. `compose.custom.yaml` の `cloudflare-tunnel` は無関係

`cloudflare-tunnel` は `image:` 指定のみでビルド対象ではない。触らない。

### 3. 付随する無害な警告（対応任意）

```
WARN Failed to get credentials for registry: asia-northeast1-docker.pkg.dev
  error="... You do not currently have an active account selected ..."
```

`~/.docker/config.json` に残った gcloud の `credHelpers` エントリが原因。
このビルドは GAR から何も引かないので失敗の原因ではない。気になる場合のみ
`gcloud auth login` するか、当該 `credHelpers` エントリを削除する。
**本修正のスコープ外**として、ユーザー判断に委ねる。

## 変更するファイル

- `.dockerignore`（新規、リポジトリルート）

コード・compose 定義・Dockerfile はいずれも変更しない。

## 検証手順

1. コンテキストサイズが落ちたことを確認:

   ```bash
   podman build -t ctx-check -f Dockerfile . 2>&1 | head -5
   ```

   従来 4.8 GB 相当だった送信量が数 MB になっていること。

2. 本番の再現コマンドを流す:

   ```bash
   devcontainer up --workspace-folder .
   ```

   `Successfully tagged ... umaxica-apps-edge-dc-core` まで到達し、
   `read/write on closed pipe` が出ないこと。

3. コンテナ内でワークスペースが揃っていることを確認（bind mount が
   `.dockerignore` の影響を受けていないことの確認）:

   ```bash
   devcontainer exec --workspace-folder . -- bash -lc 'ls -d app com org net && ls node_modules | head -3'
   ```

4. 既存のテストが通ること:
   ```bash
   pnpm run test
   ```
   （`test/compose-tunnel-invariants.test.ts` が compose 構成を検証しているため、
   compose を触っていないことの回帰確認になる。）

## リスク

低い。`.dockerignore` はビルドコンテキストの転送のみに作用し、
`Dockerfile` が何も `COPY` していない以上、生成イメージは 1 バイトも変わらない。
