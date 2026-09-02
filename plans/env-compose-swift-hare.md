# 開発コンテナから `.env` を見えるようにする

## Context

開発コンテナ内で `/home/edge/workspace/.env` を開くとコメントだけの空ファイルに見える。原因は
`compose.yaml:61-64` が `./empty.env` を read-only bind mount でその上に被せているため。ホスト側の
`.env` は存在しており、広い `.`（ワークスペース）bind 越しに本来は見えるはずだが、この 1 本の
mount が意図的に覆い隠している。同じ手口で 15 個の `{app,com,org}/{core,docs,help,info,news}/.env.development.local`
も覆われている（合計 16 本の `empty.env` mount）。

これは `empty.env` 自身のコメントどおり「ワークスペース bind が Podman Secret 配送を迂回しないように」
という設計だった。ユーザーの判断で、この env マスクを撤廃し `.env` をコンテナから読めるようにする。

**スコープ**: env 系 16 本のマスクのみ撤廃する。`.secrets/` を覆う `workspace-secrets-mask`
ボリュームは維持する（Podman Secret 配送の本体はこちら）。

**トレードオフ（承知の上で進める）**: root `.env` には `CLOUDFLARE_API_TOKEN` / `CLOUDFLARED_TOKEN` /
`EDGE_PUBLIC_ORIGIN` が入っている。「Cloudflare 資格情報はコンテナ内の対話 `wrangler login` で取り、
長寿命トークンは持ち込まない」という現行方針（`compose.yaml:146-150`、
`docs/development/wrangler-authentication.md`）とは逆方向の変更になる。

読み取りだけで十分との回答だったが、`.` の bind は read-write なので、マスクを外すと `.env` は
そのまま読み書き可能になる。read-only 専用の再 mount を足すのは機構が増えるだけなので採らない。

## 変更内容

### 1. `compose.yaml` — マスト

- `services.core.volumes` から `source: ./empty.env` の bind mount を **16 本すべて削除**（現行
  61-123 行付近）。`.secrets` を覆う `workspace-secrets-mask` ボリューム（55-60 行）は**残す**。
- `security_opt` の日本語コメント（168 行付近）の「`.` と 16 個の empty.env で計 17 本」を
  「`.` の 1 本」に修正する。`label=disable` を残す理由（SELinux 下でホスト側を再ラベルしない）は
  そのまま有効なので文意は変えない。

### 2. `empty.env` — 削除

参照が `compose.yaml` だけになるため削除する。`tools/vpc-probe/empty.env` は別物（wrangler の
`--env-file` 用）なので触らない。

### 3. `.dockerignore` / `.containerignore`

2 ファイルは意図的な重複なので、必ず同じ内容に保つ（先頭コメントが規定）。

- `**/.env.development.local` の**エントリ自体は残す**。ただし直前のコメントは「Compose が
  empty.env をこのパスに mount する → Podman が mount target をホスト側に作る → ビルドが読めない」
  という、もう成立しない因果を説明しているので、「gitignore 対象のローカル資格情報ファイルは
  イメージに入れない」という理由に書き換える。
- `/.env` を新規に追加する。ビルドコンテキストと compose の bind は別経路であり、`.env` を
  コンテナから見えるようにすることとイメージに焼き込まないことは両立する。

### 4. `test/development-container-security.test.ts` — マスト

`'masks ignored workspace credential inputs behind non-secret mounts'`（199-209 行）が現状の
マスクを固定しているので必ず落ちる。

- `.secrets` 側の 3 アサーション（`target: /home/edge/workspace/.secrets` /
  `source: workspace-secrets-mask` / `nocopy: true`）は残す。
- `target: /home/edge/workspace/.env` と、15 件を数える正規表現アサーションを削除する。
- 代わりに「`empty.env` mount が復活していないこと」を negative assertion で固定し、テスト名と
  コメントを新しい意図（`.secrets` のみマスクする）に合わせて書き換える。

同ファイルの `'does not bake or interpolate credentials'`（242 行〜）は無変更で通るはず
（`compose.yaml` に `CLOUDFLARE_API_TOKEN` は現れず、`${...}` 補間は `GH_TOKEN` と
`TUNNEL_TOKEN` の 2 本のまま）。

### 5. ドキュメント

- `docs/development/credential-and-secret-management.md:58-62` — 「root `.env` と per-frame
  `.env.development.local` は value-free mount でマスクされる」という記述を削除し、`.secrets/` の
  空 read-only ボリュームだけが残ることと、`.env` はコンテナ内から読めることを明記する。
- `docs/development/devcontainer-cli-podman-startup.md:83-84` — 列挙から
  「the `empty.env` masks over ignored environment paths」を削除。
- `docs/development/edge-environment-refresh-report.md` は日付入りの経緯レポートなので**変更しない**。

### 6. 手を入れないもの（判断と申し送り）

- `scripts/dev-start:23-38` のガードは `.dev.vars` / `.env.local` / `.env.test.local` /
  `.env.production.local` を見ており、`.env.development.local` は元々対象外（マスクで担保していた）。
  マスク撤廃後はこれらもコンテナから見えるようになる。ユーザーの「すべてのマスクを撤廃」に沿って
  ガードは広げないが、この点は明示的な変更結果として申し送る。
- `compose.custom.yaml`（gitignore 済みのローカル旧 override）42 行にも「16 個の empty.env」と
  書いてあるが、追跡外なので任意。`compose.override.yaml.example` には該当記述なし。

## 検証

1. `podman compose -f compose.yaml config` が通り、出力に `empty.env` が 1 件も現れないこと。
2. `pnpm run test` のルート不変条件スイート（`vitest run --dir test`）が green。
   特に `test/development-container-security.test.ts`。
3. `pnpm run check`（format / lint / typecheck 含む）。
4. コンテナを作り直して実地確認:
   ```bash
   podman compose -f compose.yaml down
   scripts/dev-start
   podman compose -f compose.yaml exec core cat /home/edge/workspace/.env
   ```
   コメントだけでなく `CLOUDFLARED_TOKEN=` 以下の実値が出ること。
5. `scripts/verify-build-context` を実行し、`.env` がビルドコンテキストに入っていないことを確認する。
