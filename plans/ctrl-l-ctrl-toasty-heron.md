# 開発コンテナのシェルで Ctrl+L / Ctrl+C が効かない問題の修正

## Context

開発コンテナ内のシェルで Ctrl+L・矢印キー・履歴が反応せず、Ctrl+C も伝わらない。
Ctrl+D だけが効き、それを押すとセッションが即座に落ちる。

調査の結果、**独立した 2 つの原因**が同時に起きていることが判明した。

### 原因 1（退行）: `TERM` のホスト転送 — コミット 9a42876 (2026-08-09)

`.devcontainer/devcontainer.json` の `remoteEnv` に `"TERM": "${localEnv:TERM}"` が
追加された。ホストは Ghostty (`TERM=xterm-ghostty`) だが、コンテナ内で検証すると:

```
$ podman exec umaxica-apps-edge-dc-core-1 bash -lc 'infocmp xterm-ghostty'
terminfo: MISSING
$ TERM=xterm-ghostty tput clear
tput clear FAILS
$ apt-cache policy ncurses-term
  Installed: (none)
$ ls /usr/share/terminfo/x/
xterm  xterm-256color  xterm-color  xterm-debian  xterm-mono  xterm-r5  xterm-r6 ...
```

Ghostty は terminfo を自前配布するため、ホストに存在してもイメージには無い。
bash readline の `clear-screen` (Ctrl+L) は terminfo の `clear` を引くので無反応になる。
矢印キー・履歴・`less`・`htop`・TUI 全般も同時に壊れる。
この commit 以前はコンテナ内 `TERM` が podman 既定の `xterm` だったため問題が出ていなかった。

なお `compose.yaml` の `tty: true` / `stdin_open: true` は**ファイル初出コミット
d6fcb7d から一貫して存在**しており、退行の原因ではないし追加の余地もない
(`git log -S'tty: true' -- compose.yaml` で確認済み)。

### 原因 2: `devcontainer exec` に PTY が無い

`devcontainer exec` は stdin をパイプで繋ぐだけで擬似端末を割り当てない。
端末が無いと line discipline (`ISIG`) も無いため `^C` が SIGINT に変換されず、
Ctrl+D は端末の EOF ではなく**パイプのクローズ**として働き bash が即終了する
(体感上「コンテナが落ちる」)。`podman exec` も `-t` 無しでは同じ:

```
$ podman exec umaxica-apps-edge-dc-core-1 bash -c 'tty'
not a tty
```

## 変更内容

### 1. `.devcontainer/devcontainer.json` — `TERM` を固定値に

`remoteEnv` を次のように変更する。ホストの `TERM` をそのまま持ち込むのをやめ、
イメージの terminfo に必ず存在する値に固定する。`COLORTERM` は 24bit 色の判定に
使われるだけで terminfo を引かないので、ホスト転送のままで無害。

```jsonc
  "remoteEnv": {
    "EDITOR": "code --wait --reuse-window",
    "DEBUGGER_DISABLE": "1",
    // ホストの TERM を転送しないこと。Ghostty/kitty/WezTerm は terminfo を
    // 自前配布するため、ホストに xterm-ghostty があってもイメージには無く、
    // Ctrl+L・矢印キー・履歴・TUI が全滅する (2026-08-09 の 9a42876 で発生)。
    // Debian trixie ベースイメージに必ず存在する値に固定する。
    "TERM": "xterm-256color",
    "COLORTERM": "${localEnv:COLORTERM}"
  },
```

### 2. `README.md` — 対話シェルの入り方を明記

`devcontainer exec` は PTY を割り当てないためワンショット実行専用である旨と、
対話シェルは以下を使う旨を 1 節追加する:

```bash
podman compose exec core bash -l          # 既定で -it 相当
podman exec -it umaxica-apps-edge-dc-core-1 bash -l
```

VS Code の統合ターミナルから入る場合は拡張機能側が PTY を張るので影響を受けない。

## 変更しないもの

- `compose.yaml` — `tty: true` / `stdin_open: true` は既に存在し、かつ PID 1 の
  `sleep infinity` にしか効かない。触る必要がない。
- `Dockerfile` に `ncurses-term` を追加する案は採らない。Debian の `ncurses-term`
  にも `xterm-ghostty` は含まれず問題が解決しない上、イメージが太るだけになる。

## 検証

1. コンテナを再作成する（`remoteEnv` の変更は再作成が必要）。
2. `podman compose exec core bash -l` で入り、以下を確認する:
   - `tty` → `/dev/pts/N` が返る（`not a tty` でないこと）
   - `echo $TERM` → `xterm-256color`
   - `infocmp $TERM > /dev/null && echo ok` → `ok`
   - Ctrl+L で画面がクリアされる
   - 上矢印で履歴が出る
   - `sleep 30` を実行し Ctrl+C で中断できる
   - `htop` / `less README.md` が正常に描画される
3. Ctrl+D でシェルのみ終了し、`podman ps` でコンテナが `Up` のままであることを確認する。
