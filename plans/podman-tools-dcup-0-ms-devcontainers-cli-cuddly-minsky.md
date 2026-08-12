# devcontainer が起動しない: `missing networks: default`

## Context

`podman/tools/dcup` が devcontainer CLI の `config` 段階で落ちる:

```
RuntimeError: missing networks: default
```

原因は `compose.custom.yaml` にある。サービス `core` が

```yaml
services:
  core:
    networks:
      default: {}
      edge-tunnel: { aliases: [edge-core] }
networks:
  edge-tunnel:
    name: umaxica-edge-tunnel
```

と `default` を**参照**しているが、トップレベル `networks:` に `default` の**宣言**がない。

Docker Compose は `default` を暗黙に用意するので通るが、podman-compose 1.6.0 はそうしない。
`/usr/lib/python3.14/site-packages/podman_compose.py:2698-2725` を読むと、トップレベル
`networks:` が空のときだけ `default` を自動追加し、1つでも定義があれば
`allnets - given_nets` の差分をそのまま `RuntimeError` にする。`edge-tunnel` が定義済みなので
`default` が「未定義ネットワーク」と判定される。

`compose.custom.yaml` は最近 `devcontainer.json` の `dockerComposeFile` に追加されたばかりで
(トンネル用ネットワークを Edge 側が所有する方針、`adr/008` / `test/compose-tunnel-invariants.test.ts` 参照)、
そこで初めて表面化した。

## 変更内容

### 1. `compose.custom.yaml` — トップレベルに `default` を宣言

`networks:` ブロックに1エントリ追加するだけ:

```yaml
networks:
  default: {}
  edge-tunnel:
    name: umaxica-edge-tunnel
```

なぜ「サービス側から `default: {}` を消す」ではなくこちらか:
サービスに `networks:` を書いた時点で暗黙の default は付かないため、消すと `core` は
`edge-tunnel` だけに接続される。それでもポート公開は動くが、Docker Compose 実行時との
挙動差が残る。宣言を足す方が両エンジンで同一の結果になり、意図（既定ネットワーク +
トンネル用ネットワークの二枚差し）もそのまま保たれる。

`{}` はデフォルト設定のまま compose 管理下に置く指定で、ネットワークは
`umaxica-apps-edge-dc_default` として作成される。

宣言追加と同時に、なぜこの1行が要るのか（podman-compose は default を暗黙に作らない）を
ファイル冒頭コメント群の作法にあわせて短く注記する。

### 2. `podman/tools/dcup` — プリフライトを実構成にそろえる

現状のプリフライトは

```bash
"${compose_path}" -f compose.yaml -f .devcontainer/compose.override.yml config >/dev/null
```

で `compose.custom.yaml` を含んでいない。`devcontainer.json` の `dockerComposeFile` は3枚使うので、
プリフライトが通っても本番の `config` で落ちる — 今回まさにこれが起きた。3枚目を追加して、
壊れた構成をスタックトレースではなく dcup 自身のエラーで捕まえられるようにする。

## 影響確認

- `test/compose-tunnel-invariants.test.ts` の `networksBlock` に対する表明は
  「`external: true` を含まない」「`name: umaxica-edge-tunnel` を含む」の2点のみ。
  `default: {}` の追加はどちらにも抵触しない。connector / token 系の表明も無関係。

## 検証

```bash
# 1. 3枚合成が通ること（今まさに落ちている箇所）
podman-compose -f compose.yaml -f .devcontainer/compose.override.yml -f compose.custom.yaml config

# 2. core が両ネットワークに載っていること（上の出力で確認）
#    services.core.networks に default と edge-tunnel、edge-tunnel 側に alias edge-core

# 3. 実際に起動
podman/tools/dcup

# 4. コンテナから見えるネットワーク
podman inspect -f '{{json .NetworkSettings.Networks}}' <container> | jq keys
#    => ["umaxica-apps-edge-dc_default", "umaxica-edge-tunnel"]

# 5. ガードレールとスイート
pnpm exec vitest run test/compose-tunnel-invariants.test.ts
pnpm run format:check && pnpm run lint:check && pnpm run typecheck && pnpm run test
```
