# pnpm 12 へのアップグレード（Containerfile 起点）

## Context

pnpm 12.0.0 がリリースされた。開発コンテナは `Containerfile` の `ARG PNPM_VERSION=11.22.0` で
pnpm を固定しており、`package.json#devEngines.packageManager.version` と一致していることを
`test/development-container-security.test.ts` が検証している。両者を 12.0.0 に上げ、
pnpm 11 のディレクトリレイアウトに依存している Containerfile の処理と、11.22.0 を
明記しているドキュメントを追随させる。

注意: 12.0.0 は npm の `latest` ではなく `next-12` タグにのみ存在する（`latest` = 11.24.0）。
ユーザー判断により 12.0.0 を採用する。`get.pnpm.io/install.sh` は `PNPM_VERSION` を
明示指定するので dist-tag に依存せず取得できる。

## 変更

### 1. `Containerfile`

- 4–5 行目付近: `ARG PNPM_VERSION=11.22.0` → `ARG PNPM_VERSION=12.0.0`。
- 162–167 行目のコメント: 「pnpm 11 moved every global binary into a `bin` subdirectory」を
  pnpm 12 でも同じ（v11 以降のレイアウト）である旨に書き換える。`PATH` 自体
  (`/home/edge/.local/share/pnpm/bin`) は変更不要。
- 181–194 行目の symlink 解決 `RUN`: グロブが `"${PNPM_HOME}"/global/v11/*/node_modules/@pnpm/exe`
  とメジャー番号をハードコードしている。pnpm 12 では `global/v12` になる可能性が高く、
  そのままだとグロブが外れて deref が黙って no-op になり（`[ -L ... ] || continue` で
  握り潰される）、compose の `pnpm-store` ボリューム被せで `pn`/`pnpm` が実行時に壊れる。
  → `"${PNPM_HOME}"/global/*/*/node_modules/@pnpm/exe` にバージョン非依存化する。
  併せてコメント中の `store/v11/links/...` の記述も一般化する。
  末尾の `pnpm --version` はビルド時の検証として残す（12.0.0 を出力すること）。

### 2. `package.json`

- `devEngines.packageManager.version` を `"12.0.0"` に更新（`onFail: "download"` は据え置き）。

### 3. `README.md`

- 16 行目 `- [pnpm](https://pnpm.io/) 11.22.0 ...` → `12.0.0`。
- 他に 11.22.0 を書いているドキュメント（`docs/development/development-environment-overview.md`
  など）を `grep -rn "11\.22\.0"` で洗い、実体を指しているものだけ更新する。
  `docs/development/edge-environment-refresh-report.md` や `plans/` 配下の過去記録は
  当時の事実なので触らない。

### 4. `test/development-container-security.test.ts`

アサーション自体は `devEngines` と Containerfile の一致を見る形（324 行目付近）なので
コード変更は不要。316–322 行目の pnpm 11 前提のコメントだけ現状に合わせる。

### 5. `pnpm-lock.yaml`

pnpm 12 は peer 解決のサイクル切りが正準化されたため、初回の更新時に再解決が入りうる。
`pnpm install` 後に lockfile の差分が出たらそれも同一コミットに含める
（`lockfileVersion: '9.0'` 自体は据え置きの見込み）。

## 検証

1. `podman build -f Containerfile .`（または `scripts/dev-start`）でイメージをビルドし、
   最後の `RUN` の `pnpm --version` が `12.0.0` を出すこと。
2. コンテナ内で `pnpm --version` / `pn --version` が通ること
   ＝ `pnpm-store` ボリュームをマウントした状態でも deref が効いていることの確認
   （ここが今回いちばん壊れやすい）。
3. `pnpm install` → `pnpm run check`（`test/development-container-security.test.ts` を含む）。
4. `pnpm run build` は依存解決の再現性確認として一度通す。
