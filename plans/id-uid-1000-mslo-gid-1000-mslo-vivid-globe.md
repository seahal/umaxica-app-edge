# 開発コンテナから sudo / su / visudo を廃止する

## Context

開発コンテナ(Podman rootless、Dev Container、サービス`core`)は現在、`edge`ユーザーが`sudo`グループに所属し、`/etc/sudoers.d/devcontainer`で`NOPASSWD:ALL`が付与されている。これにより本来は非root(`edge`, uid/gid 1000/1000)で動くはずのコンテナが、実質的にいつでもrootになれる状態になっている。

現状、`podman compose up` → `devcontainer exec`のたびに `sudo chown -R 1000:1000 ..` を手動実行しないと、`~/.cache`・`~/.local/share`・`node_modules`などの書き込みができず、`pnpm install`やCodex CLIの起動(`~/.codex`アクセスエラー)が失敗する。これは「起動のたびに毎回rootで chown -R する」という、今回明確に排除したいアンチパターンを手作業でなぞっている状態であり、sudoを消すには、その場しのぎの回避策ではなく、所有権が壊れる根本原因を直さなければならない。

調査で判明した根本原因:

- `Dockerfile`が最終ステージで `$HOME/.cache` と `$HOME/.local` を `rm -rf` してから `USER edge:group` に切り替えている(109-112行目)。そのため、イメージ内にはこれらのパスの中身(＝所有権の手本)が存在しない。
- `compose.yaml`はまさにそのパス(`/home/edge/.cache`, `/home/edge/.local/share`)に空の名前付きボリューム(`home-cache`, `home-local-share`)をマウントしている。イメージ側にpopulateすべき中身がないため、ボリューム初回マウント時の所有権が意図通りにならず、rootになりやすい。
- ホストの`mslo`(uid=gid=1000)とコンテナの`edge`(uid=gid=1000)は偶然一致しており、UID/GIDのズレ自体は問題ではない(`.codex`等のbind mountは host uid=1000=mslo 所有で正しい)。
- Podmanは完全移行済みでrootless(`podman info`で確認済み、`Rootless: true`)。Docker互換は今後不要と確認済み。`.devcontainer/compose.override.yml`の`userns_mode: keep-id`は正しい機構だが、`user: !reset null`で無効化した`user: edge:group`と機構が二重管理になっている。

## 決定事項

- Podman専用に最適化する(Docker互換は破棄してよい、ユーザー確認済み)。
- `home-cache` / `home-local-share` / `node-volume` は完全に作り直してよい(再生成可能なキャッシュ、ユーザー確認済み)。ホスト側リポジトリ自体はすでに正しい所有権(`mslo:1000`)なので、リポジトリファイルへの`chown`は不要。
- `sudo`パッケージ・`sudo`グループ登録・`/etc/sudoers.d/devcontainer`を完全撤廃する。
- `su`は削除しない。Debianベースイメージでは`root`アカウントにパスワードが設定されていない(ロック状態)ため、`su`バイナリが存在しても`edge`ユーザーから`su -`で昇格することはできない。これを検証テストで確認する(バイナリ削除ではなく、実質的に昇格経路が塞がっていることの確認に切り替える)。
- 常時rootのentrypointは導入しない。現状もentrypointスクリプトはなく(`CMD ["sleep", "infinity"]`のみ)、追加不要。

## 実装計画

### 1. `Dockerfile`

- 18-33行目のapt-getリストから `sudo` を削除。
- 38-59行目の`usermod --append --groups sudo "${target_user}";` の行を削除。
- 61-62行目のsudoers生成ブロック(`RUN printf ... /etc/sudoers.d/devcontainer && chmod 0440 ...`)を丸ごと削除。
- 109-110行目の `RUN rm -rf "${HOME}/.cache"` / `RUN rm -rf "${HOME}/.local"` を削除し、代わりに98-104行目の`mkdir -p`リストに `"${HOME}/.cache"` と `"${HOME}/.local/share"` を追加して、既存の`chown -R "${DOCKER_UID}:${DOCKER_GID}" "${HOME}"` の対象に含める。これにより、イメージ内に正しい所有権の空ディレクトリが存在した状態でボリュームがマウントされ、Podmanのボリューム初回populate時に`edge:group`所有権が引き継がれる。

### 2. `compose.yaml`

- `core`サービスに `userns_mode: keep-id` を追加し、`user: edge:group` の行を削除する(rootless keep-idではプロセスUIDのマッピングをPodmanに任せ、compose側で二重に`user:`を指定しない)。
- これにより`.devcontainer/compose.override.yml`側の`userns_mode: keep-id` / `user: !reset null` は不要になる。

### 3. `.devcontainer/compose.override.yml`

- `userns_mode: keep-id` と `user: !reset null` の行を削除(base側に統合したため)。
- ports override、dns、`DEVCONTAINER=1`環境変数、volumesの再掲部分はそのまま維持(devcontainer固有の設定のため)。

### 4. `README.md`

- `docker compose up && docker compose exec core bash` のような記述があれば `podman compose up -d && podman compose exec core bash` に書き換える(Podman完全移行に合わせるドキュメント整合)。

## 一回限りの移行手順(ホスト側で実行)

既存の`home-cache`・`home-local-share`・`node-volume`ボリュームは、修正前のDockerfileに基づいて作られた、所有権が壊れた状態のものなので、作り直す。

```sh
# ホスト側、リポジトリルートで実行
podman compose down          # コンテナ停止
podman compose down -v       # 上記3ボリュームを含め削除(postgres-dataも削除される点に注意。DBデータを残したい場合は個別に `podman volume rm` で対象を絞る)
podman compose build --no-cache core   # sudo削除・mkdir変更を反映した新イメージを作成
podman compose up -d
```

`postgres-data`ボリュームを残したい場合は `down -v` の代わりに次を使う:

```sh
podman compose down
podman volume rm umaxica-apps-edge_home-cache umaxica-apps-edge_home-local-share umaxica-apps-edge_node-volume
podman compose build --no-cache core
podman compose up -d
```

(実際のボリューム名は `podman volume ls` で事前に確認する。)

ホスト側のリポジトリ本体・`~/.codex` `~/.claude` `~/.copilot` `~/.gemini` は既に`mslo`所有で正しいため、追加の`chown`は不要。

## 検証テスト

```sh
# ユーザー確認
podman compose exec core id                      # uid=1000(edge) gid=1000(group), sudoグループなし
podman compose exec core sh -lc 'printf "HOME=%s\n" "$HOME"'
podman compose exec core sh -lc 'test "$(id -u)" -ne 0'
podman compose exec core sh -lc 'test -w "$HOME"'
podman compose exec core sh -lc 'test -w "$PWD"'

# sudo系コマンドの不存在
podman compose exec core sh -lc '! command -v sudo'
podman compose exec core sh -lc '! command -v visudo'

# su が実質使えないことの確認(バイナリの有無ではなく昇格不可を確認)
podman compose exec core sh -lc 'su -c "id" root </dev/null; echo "exit=$?"'   # 認証失敗で失敗するはず

# 所有権(chownなしで正しいはず)
podman compose exec core sh -lc 'ls -ld ~/.cache ~/.local ~/.local/share ~/workspace ~/workspace/node_modules'

# pnpm
podman compose exec core sh -lc 'pnpm --version && pnpm install --frozen-lockfile && pnpm run build && pnpm run test'
podman compose exec core sh -lc 'pnpm install --lockfile-only'   # 更新系の安全確認

# Codex
podman compose exec core sh -lc 'ls -ld ~/.codex && codex --version'  # 実際の起動確認はdevcontainer exec経由で行う

# リポジトリ操作
podman compose exec core sh -lc 'git status && touch .permission-test && rm .permission-test'

# 再構築(キャッシュあり/なし)
podman compose build core
podman compose build --no-cache core
podman compose up -d

# 静的検索(残存確認)
grep -RInE '\b(sudo|visudo|sudoers|NOPASSWD)\b' --exclude-dir=.git .
```

すべて`sudo`なしで、`edge`ユーザーのまま完了することを確認する。
