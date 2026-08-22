# Static Analysis / Repository Hygiene ゲートの統合

## Context

このリポジトリは 21 deployment unit + root の pnpm workspace で、format / lint /
type check / test / build / Lefthook / CI の品質パイプラインが既に高い完成度で
存在する。目的は「5 個の npm パッケージを足す」ことではなく、現在カバーされて
いない 4 つの検査軸 — **dependency architecture / workspace consistency /
spelling / frontend performance budget** — を、既存の
`pnpm → Lefthook → CI` という同一パイプラインへ、重複なく組み込むこと。

すべての作業は稼働中の podman コンテナ `umaxica-apps-edge-dc-core-1`
(`/home/edge/workspace`) の中で行う。ホスト側で pnpm を直接叩かない。

```
podman exec umaxica-apps-edge-dc-core-1 sh -lc 'cd ~/workspace && <cmd>'
```

---

## 1. 現状監査(実測済み)

| 軸                             | 現状                                                                                                                                                   | 判定                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| format                         | `oxfmt` root + 全 unit、`format:check`、Lefthook pre-commit、CI `format` job                                                                           | **既存・十分**                   |
| lint                           | `oxlint` + `oxlint --type-aware`(tsgolint)、pre-commit/pre-push/CI                                                                                     | **既存・十分**                   |
| typecheck                      | `tsc --noEmit`(TypeScript 7.0.2)、全 unit、pre-push/CI                                                                                                 | **既存・十分**                   |
| unit test                      | Vitest、per-unit + repo-level invariant suite (`test/`)                                                                                                | **既存・十分**                   |
| integration (HTTP)             | Hurl、`<unit>/api/`、CI `test-api` matrix 20 unit                                                                                                      | **既存・十分**                   |
| e2e                            | Playwright、`<unit>/e2e/`。CI 非実行(browser binary 未導入・文書化済)                                                                                  | **既存・意図的な穴**             |
| build                          | 21 unit の CI matrix                                                                                                                                   | **既存・十分**                   |
| dead code / unused deps        | **Knip 既に完全統合**(per-unit `knip.jsonc`、CI 21 job matrix、`check:static` 内)                                                                      | **既存 → 精度の微調整のみ**      |
| dependency architecture        | oxlint `import/no-cycle` + `no-restricted-imports` + `test/deployment-unit-boundaries.test.ts`。dependency-cruiser は TS7 移行時に撤去済               | **部分的 → JS/MJS 面を今回追加** |
| dependency version consistency | pnpm catalog + `overrides` + `minimumReleaseAge`。**強制する機構なし**(catalog の comment 自身が「knip が 6.32.1/6.32.2 に drift した」と記録している) | **不足 → syncpack を追加**       |
| spelling                       | なし                                                                                                                                                   | **不足 → CSpell を追加**         |
| bundle / performance budget    | なし                                                                                                                                                   | **不足 → Size Limit を追加**     |
| supply chain                   | `pnpm audit`, `pnpm outdated`, gitleaks, `minimumReleaseAgeStrict`                                                                                     | **既存・十分**                   |

**廃止候補: なし。** 既存ツールを置き換える提案はしない。今回追加する 4 つは
いずれも既存ツールが担当していない責務のみを担う。

**重複を避けた判断:**

- Knip は再導入しない(既に存在)。unused files / exports / deps / devDeps /
  binaries / unresolved はすべて既に CI ゲート。今回の差分は §2 の 2 点のみ。
- dependency-cruiser に circular detection を**担当させない**。oxlint の
  `import/no-cycle` が全 unit で既に error であり、しかも TS を読める(§3)。
- syncpack に `packageManager` / Node version の検査を**担当させない**。
  `devEngines` + `test/package-manager-invariants.test.ts` が既にそこを持つ。
- CSpell を Markdown 以外に広げても oxlint とは衝突しない(識別子の綴りと
  lint rule は別軸)。

---

## 2. Knip(既存 — 2 点だけ強化)

追加インストールなし。

1. **configuration hints を error に昇格。** Knip 6 の
   `--treat-config-hints-as-errors` を全 unit の `knip` script と CI に付ける。
   現在 hint は出力されるだけで exit code に影響せず、`knip.jsonc` が実態から
   ずれても緑になる。
   → 全 unit `package.json`: `"knip": "knip --treat-config-hints-as-errors"`。
2. **production mode の役割分担を実測してから決める。**
   `knip --production` は「デプロイされるバンドルの中で死んでいるか」を答え、
   既定の run は「リポジトリ全体で死んでいるか」を答える。別の質問なので
   重複ではない。まず 21 unit で実行し、**0 件なら** `knip:production` script
   と CI job としてゲート化する。件数が出る場合は件数を報告し、ゲート化は
   別作業として切り出す(false positive を ignore で黙らせない)。

`--fix` は今回一切使わない(scripts にも CI にも入れない)。

---

## 3. dependency-cruiser(JS/MJS 面のみに限定導入)

### 実測した制約 — これが設計の根拠

`.dependency-cruiser.README.md` の主張が **最新 18.2.0(2026-08-10 公開、
これが latest)でも成立する**ことをコンテナ内で確認した:

```
$ pnpm exec depcruise --no-config --ts-config app/core/tsconfig.json app/core/src
✔ no dependency violations found (0 modules, 0 dependencies cruised)
‼ missing-typescript-transpiler: ... (typescript: >=2.0.0 <7.0.0)
   => Support for typescript@>=7 will follow when its API is published and stable.

$ pnpm exec depcruise --no-config tools
✔ no dependency violations found (8 modules, 11 dependencies cruised)
```

このリポジトリは typescript 7.0.2。**TS ソースは 1 モジュールも解析されない。**
JS/MJS は正常に解析される。

### 従って強制する範囲

**リポジトリ root 所有の JS/MJS ツールチェーンのみ**を cruise 対象にする。
これは AGENTS.md の「root の config は repo-level ファイルにのみ適用」という
既存規約とちょうど一致し、per-unit コピーを作らないので
`test/deployment-unit-boundaries.test.ts` にも触れない。

対象: `tools/**/*.mjs`(`check-workers.mjs`, `verify-edge-connectivity.mjs`,
`tools/lib/`, `tools/vpc-probe/`)、および `scripts/` 配下の Node スクリプト。

### 「今すぐ強制できる rule」(= current baseline、実測後に確定)

存在しないアーキテクチャを発明せず、**現在すでに成立している依存方向のみ**を
ルール化する。まず `depcruise --output-type dot` で現状を出力し、その上で:

| rule                                               | severity         | 根拠                                             |
| -------------------------------------------------- | ---------------- | ------------------------------------------------ |
| `no-circular`                                      | error            | 現状 0 件(11 dependencies、循環なし)             |
| `not-to-dev-dep`                                   | error            | production スクリプトが devDependency を掴まない |
| `no-orphans`                                       | **実測後に決定** | 0 件なら error、出るなら理由を個別に確認         |
| `no-deprecated-core` / `no-non-package-json`       | error            | 既定 rule、コスト 0                              |
| `tools/lib/` は `tools/*.mjs` からのみ import 可   | error            | 現状の実態                                       |
| `test/` → `tools/` は可、`tools/` → `test/` は禁止 | error            | production→test の逆流禁止                       |

### 「将来の invariant」(= 今回は強制しない、文書に記録するのみ)

- TS 層の feature/shared/application 依存方向
- deployment unit 間の越境 import(→ 現在 `test/deployment-unit-boundaries.test.ts` が担当)
- private implementation への越境 import

これらは dependency-cruiser が TS7 を読めるようになった時点(18.x 系が
`typescript@>=7` を宣言した時)に移管を検討する、と文書に条件付きで書く。
**大量の既存 violation を ignore で黙らせる箇所は 1 つも作らない。**

設定ファイル: root に `.dependency-cruiser.jsonc`(1 ファイルのみ)。
`.dependency-cruiser.README.md` は §7 の新 doc に統合して削除する
(同じ説明を複数ファイルに置かない)。

> 監査中に root `package.json` へ `dependency-cruiser: catalog:` を追加済み。
> catalog には元から `dependency-cruiser: ^18.2.0` の entry があった。

---

## 4. syncpack(新規)

### 実測したベースライン

全 22 manifest を走査した結果:

- **真の drift: 1 件のみ** — `vitest` が root で `^4.1.10`、21 unit で `catalog:`
  (catalog の値も `^4.1.10` なので実害は今はない。まさに drift の起点)。
- **catalog 未経由で複数 unit に散っている literal 指定: 7 パッケージ**
  — `@testing-library/jest-dom`(22)、`@vitest/coverage-v8`(22)、
  `happy-dom`(22)、`@playwright/test`(21)、`@testing-library/react`(17)、
  `server-only`(15)、`@hono/structured-logger`(4)。
  今日は全 unit で一致しているが、**それを保証する機構が何もない**。
  catalog の comment が記録している knip 6.32.1/6.32.2 事故と同じ形。
- **意図的に単一 unit のみの literal**: `lefthook`(root)、`@sentry/nextjs`
  (dev/acme)、`vercel`(dev/{acme,apex})。これらは catalog 化する理由がない。

### 設定方針 — 「全部同じ version」にはしない

root `.syncpackrc.json`。syncpack 15 は pnpm catalog を第一級で理解する
(`versionGroups` の `policy: "catalog"`、catalog 定義を `pnpm-workspace.yaml`
から読む)。

1. **同一 version の強制**(全 dependencyTypes)— 上の drift 1 件を検出する。
2. **`policy: "catalog"` group** — 2 unit 以上で使われる依存は `catalog:` で
   なければ error。上の 7 パッケージが対象。単一 unit のものは `packages` /
   `dependencies` 指定で対象外にし、**その理由をコメントで書く**。
3. **`workspace:` protocol** は syncpack の workspace semantics に委ね、
   version group で触らない。
4. **`packageManager` / Node version は syncpack に検査させない** —
   `devEngines` と `test/package-manager-invariants.test.ts` の担当(重複回避)。
5. `overrides` / `peerDependencyRules` は既に root 単一定義で drift しえないため
   group を作らない。

### 移行の扱い

7 パッケージの catalog 化は**実装時に実施する**(ignore で黙らせない)。
`pnpm-workspace.yaml` の `catalog:` へ entry を追加し、各 manifest を
`catalog:` へ書き換える。既存 catalog entry と同じく**なぜ catalog に置くのか
のコメントを付ける**(このファイルの既存の書き方に合わせる)。
ただし `@hono/structured-logger`(4 unit)のみ、apex 4 unit 限定の依存なので
catalog 化するか個別判断し、判断理由を記録する。

### check / fix の分離

- `check:deps` → `syncpack lint`(read-only、CI と pre-push)
- `fix:deps` → `syncpack fix`(**ローカル専用**。CI からも Lefthook からも呼ばない)

---

## 5. CSpell(新規)

root `cspell.config.yaml` 1 ファイル + `.cspell/project-words.txt`
(project dictionary)。

- **対象**: `**/*.{ts,tsx,js,jsx,mjs,cjs,json,jsonc,yaml,yml,md,css}` +
  `adr/`, `docs/`, `plans/` 配下の Markdown。
- **除外**: `useGitignore: true` を基本にしつつ、明示的に
  `node_modules`, `dist`, `.next`, `.open-next`, `.wrangler`, `coverage`,
  `test-results`, `pnpm-lock.yaml`, `*.tsbuildinfo`,
  生成物(`cloudflare-env.d.ts`, `worker-configuration.d.ts`, `public/style.css`)。
- **辞書**: `dictionaryDefinitions` で `project-words` を 1 つ定義し、
  ブランド名(umaxica, seahal)・技術用語(opennextjs, miniflare, workerd,
  oxlint, oxfmt, tsgolint, nuqs, hurl, valkey, cloudflared, tailscale …)を
  カテゴリ別のコメント付きで整理する。`ignoreWords` の羅列にしない。
- **inline ignore(`cspell:disable`)は原則使わない。** 使うのは
  base64 / hash / 外部 ID のような「単語でないもの」に限り、その行に理由を書く。
- **誤字は辞書に入れず、ソースを直す。**

### ベースライン取得と段取り(実装時)

1. `cspell lint --no-progress --gitignore .` の生 baseline を件数と語彙で集計。
2. 語ごとに「本物のタイポ / 固有語 / 技術用語 / 生成物混入」に分類。
3. 本物のタイポは修正、固有語は dictionary、生成物は ignorePaths を修正。
4. **件数が想定を大きく超えて 1 コミットで捌けない場合は、ゲート化する前に
   件数と分類の内訳を報告して段取りを相談する**(user の選択どおり、
   ignore で緑にする道は取らない)。

---

## 6. Size Limit(新規 — 対象を絞る)

### 対象判定(実測済み)

| unit 群                                                  | ブラウザ JS                                                                                                                                                  | Size Limit                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `{app,com,org}/{core,docs,help,info,news}`(Next 15 unit) | あり。`.next/static` に raw ~605 KB(docs/help/info/news)、~644 KB(core 3 unit)                                                                               | **対象**                                                              |
| `dev/acme`(Next on Vercel)                               | あり。raw ~977 KB(Sentry SDK 込み、最大)                                                                                                                     | **対象**                                                              |
| `{app,com,org,net}/apex`(Hono Workers)                   | あり、ただし極小。`public/service-worker-register.js` 169 B + `service-worker.js` 749 B の手書き静的ファイルのみ(`renderer.tsx:34` の `<script defer>` 1 本) | **対象**(budget は極小。「client script が増えたら気づく」ための番人) |
| `dev/apex`(Hono on Vercel)                               | **なし**。`src/app.ts` は template literal、`public/` は `style.css` のみ                                                                                    | **対象外**                                                            |

### plugin 選択 — preset は使わない

`@size-limit/preset-app` は `@size-limit/time` を含み、headless Chrome を
要求する。CI に browser binary が無いのは Playwright を CI から外している
理由そのものなので、**`size-limit` + `@size-limit/file` のみ**を使う。
webpack / esbuild plugin も不要(Next / wrangler が既にバンドル済み)。

### 設定

per-unit `.size-limit.json`(各 unit が自分の budget を所有する = 既存の
「全 unit が同じ contract を実装する」設計に一致)。

- Next unit: `path: [".next/static/chunks/**/*.js"]`、`gzip: true`。
  必要なら `framework` / `main` / `app` を name 付きで分割する。
- apex unit: `path: ["public/*.js"]`、`gzip: true`。
- per-unit script: `"check:size": "size-limit"`。
- root: `"check:size": "pnpm -r --filter='!./dev/apex' run check:size"`。

### baseline → budget(数字は発明しない)

実装時に **必ず build 後に実測**し、`size-limit` の出力(gzip 値)を根拠に:

```
budget = ceil(現在値 × 1.10)   # headroom 10%、kB 単位で切り上げ
```

現在値・headroom・budget の 3 列を doc の表に残す。上の raw byte 数は
build 済み成果物の生サイズであって gzip 値ではないため、**budget の根拠には
使わない**。実測の gzip 値のみを使う。

`check:size` は `check:static` に**入れない**(build を要求するため)。
実行順は常に `build` → `check:size`。

---

## 7. pnpm scripts(既存命名に合わせる)

既存の命名は `check:*`(`check:workers`, `check:generated`, `check:static`, …)
と、ツール名そのまま(`knip`, `typecheck`)の 2 系統。前者に合わせる。

### root `package.json`

| script               | 内容                                                               |
| -------------------- | ------------------------------------------------------------------ |
| `check:architecture` | `depcruise --config .dependency-cruiser.jsonc tools scripts`       |
| `check:deps`         | `syncpack lint`                                                    |
| `fix:deps`           | `syncpack fix`(ローカル専用)                                       |
| `check:spelling`     | `cspell lint --no-progress --gitignore .`                          |
| `check:size`         | `pnpm -r --filter='!./dev/apex' run check:size`                    |
| `check:static`       | 末尾に `check:architecture && check:deps && check:spelling` を追加 |

`check`(= `check:static && test`)は変更不要 — 上の 3 つが自動的に含まれる。
`check:size` は build 依存のため `check:static` の外に置く。

### 各 unit `package.json`

- 対象 20 unit: `"check:size": "size-limit"` を追加。
- 全 unit: `knip` script に `--treat-config-hints-as-errors` を追加。

### filtering

`check:size` は `--filter='!./dev/apex'` で唯一の非対象を除外。他の 3 つは
root 単発実行(per-unit 実行の必要がない repo-level 検査)なので
fan-out しない = 21 回走らない。

---

## 8. Lefthook

既存の設計思想(pre-commit は staged file 中心で軽量、pre-push は全体、
CI は完全ゲート)を維持し、**実測してから配置を確定する**。

### pre-commit(`parallel: true` を維持)

```yaml
spelling:
  glob: '*.{ts,tsx,js,jsx,mjs,cjs,json,jsonc,yaml,yml,md,css}'
  run: pnpm exec cspell lint --no-progress --no-must-find-files {staged_files}

deps:
  glob: '{package.json,pnpm-workspace.yaml,*/*/package.json}'
  run: pnpm run check:deps
```

- CSpell は staged file のみ = 差分に比例、既存の format/lint と同じ粒度。
- syncpack は manifest を触った時だけ発火。全 manifest を読むが 22 ファイルの
  JSON パースなので実測で数百 ms のはず(**要計測**)。
- Knip / dependency-cruiser / Size Limit は pre-commit に入れない。

### pre-push

```yaml
architecture: pnpm run check:architecture # tools+scripts の 8 modules、ほぼ即時
spelling: pnpm run check:spelling # 全体
deps: pnpm run check:deps # 全体
knip: pnpm run knip # ← 実測して判断(下記)
```

- **`knip` を pre-push に入れるかは実測で決める。** 21 unit 直列
  (`--workspace-concurrency=1`)で、既に pre-push には `lint:types` +
  `typecheck` + `test` が乗っている。合計が体感を壊すなら knip は CI 専任に
  留め、その判断理由を doc に書く(「CI にあるから不要」とは書かない)。
- **Size Limit は pre-push に入れない。** 20 unit の Next build が前提で、
  push 時のレイテンシとして正当化できない。CI の build matrix が担当する。
  この判断も doc に明記する。
- 既存 pre-push には `parallel` 指定がない。新規コマンドを足すにあたり
  `parallel: true` の可否を検討する(各コマンドが read-only なので安全だが、
  出力が交錯するので既存の逐次実行を尊重するか判断して記録する)。

---

## 9. CI(`.github/workflows/integration.yaml`)

すべて **`pnpm run check:*` を呼ぶだけ**にする。ツール固有の flag を YAML に
埋め込まない = local と CI が同一 script。`--fix` 相当は一切入れない。

### 新規 job(既存 `format` / `lint` job と同じ形、`ubuntu-slim`)

| job            | run                           |
| -------------- | ----------------------------- |
| `architecture` | `pnpm run check:architecture` |
| `deps`         | `pnpm run check:deps`         |
| `spelling`     | `pnpm run check:spelling`     |

いずれも `actions/checkout@v5` → `pnpm/setup@v2 (install: false)` →
`pnpm install --frozen-lockfile` → `run`。

### 既存 job の変更

- **`build` matrix**: `pnpm -C ${{ matrix.target }} run build` の直後に
  `pnpm -C ${{ matrix.target }} run check:size` を追加(`dev/apex` は
  `.size-limit.json` を持たないので、その 1 target だけ step を条件付きにするか、
  該当 unit に `check:size` を置かず `pnpm -C ... run check:size --if-present`
  相当で扱う。**実装時に `--if-present` 相当の pnpm 挙動を確認して決める**)。
  → 追加ビルド 0 回。
- **`knip` matrix**: run はそのまま(script 側に
  `--treat-config-hints-as-errors` が入るので YAML 変更不要)。
  ただし CI は `pnpm --dir <dir> exec knip` を直接叩いており script を経由して
  いない。**local = CI を守るため `pnpm --dir <dir> run knip` に変更する。**

### failure の再現性

各 job の名前を script 名と一致させ、doc に「CI job 名 → ローカルコマンド」の
対応表を置く。

---

## 10. Documentation

**新規 1 ファイルに集約する**: `docs/development/static-analysis-and-hygiene.md`

内容:

1. 責務境界表(oxfmt / oxlint / tsc / Vitest / Hurl / Playwright / Knip /
   dependency-cruiser / syncpack / CSpell / Size Limit — 各 1 行、
   「これは検査しない」も書く)
2. ツールごとに: 目的 / コマンド / 設定ファイルの場所 / Lefthook のどこ /
   CI のどこ / failure の直し方
3. dependency-cruiser が TS を読めない件の実測記録(現
   `.dependency-cruiser.README.md` の内容を移設 + 18.2.0 での再検証結果)、
   および TS7 対応時の移管条件
4. Size Limit の baseline / headroom / budget 表
5. exception を追加するときの方針(ignore は最後の手段、各 exception に
   「なぜツールが誤認するのか」の分類を必ず書く)
6. CI job 名 → ローカルコマンド 対応表

**既存ファイルへの追記は最小限に(コピーしない)**:

- `AGENTS.md` の **Toolchain** 節に script 名を追加し、新 doc へ 1 行リンク。
- `.dependency-cruiser.README.md` は新 doc へ統合して**削除**。
- `docs/development/ai-development-tools.md` / `README.md` は、新 doc への
  リンクが必要か確認してから触る。

---

## 11. Sherif

**導入しない**(scope 外)。既存導入も無し — `package.json` /
`pnpm-workspace.yaml` / lockfile / workflow のいずれにも `sherif` は存在しない
ことを確認済み。削除対象も報告対象もない。

---

## 変更するファイル

**新規**

- `.dependency-cruiser.jsonc`(root、tools/scripts 限定)
- `.syncpackrc.json`(root)
- `cspell.config.yaml` + `.cspell/project-words.txt`(root)
- `<unit>/.size-limit.json` × 20(`dev/apex` を除く全 unit)
- `docs/development/static-analysis-and-hygiene.md`

**変更**

- `package.json`(root): devDependencies 4 件追加、`check:*` script 5 件追加、
  `check:static` 拡張
- `pnpm-workspace.yaml`: catalog に syncpack / cspell / size-limit /
  `@size-limit/file` を追加。§4 で catalog 化する 7 パッケージの entry 追加
  (コメント付き)
- `<unit>/package.json` × 21: `knip` script に flag 追加、
  20 unit に `check:size` 追加、literal version → `catalog:` 置換
- `lefthook.yml`: pre-commit 2 件 / pre-push 3〜4 件追加
- `.github/workflows/integration.yaml`: job 3 件追加、`build` matrix に
  size step 追加、`knip` matrix を `run knip` 経由に変更
- `AGENTS.md`: Toolchain 節にリンク
- ソース各所: CSpell が見つけた**本物のタイポ**の修正

**削除**

- `.dependency-cruiser.README.md`(新 doc へ統合)

---

## Verification

すべてコンテナ内で実行する。

```bash
podman exec umaxica-apps-edge-dc-core-1 sh -lc 'cd ~/workspace && <cmd>'
```

| #   | コマンド                                | 期待                                                                                                               |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | `pnpm install --frozen-lockfile`        | lockfile と manifest が一致                                                                                        |
| 2   | `pnpm run format:check`                 | pass                                                                                                               |
| 3   | `pnpm run lint` / `pnpm run lint:types` | pass                                                                                                               |
| 4   | `pnpm run typecheck`                    | pass                                                                                                               |
| 5   | `pnpm run knip`                         | pass(hints も error 扱いで)                                                                                        |
| 6   | `pnpm run check:architecture`           | 解析モジュール数 > 0 かつ violation 0。**「0 modules で緑」を必ず確認して弾く**                                    |
| 7   | `pnpm run check:deps`                   | pass(catalog 移行後)                                                                                               |
| 8   | `pnpm run check:spelling`               | pass                                                                                                               |
| 9   | `pnpm run test`                         | pass(`test/deployment-unit-boundaries.test.ts` と `package-manager-invariants.test.ts` が新 config で壊れないこと) |
| 10  | `pnpm run build`                        | pass                                                                                                               |
| 11  | `pnpm run check:size`                   | 全 unit で budget 内。出力の実測値を doc の表と突き合わせる                                                        |
| 12  | `pnpm run check`                        | pass(aggregate)                                                                                                    |
| 13  | `pnpm run test:api`                     | 触った範囲があれば実行                                                                                             |

**Lefthook の実地検証**

```bash
pnpm exec lefthook run pre-commit
pnpm exec lefthook run pre-push
```

さらに、意図的に壊して**検出されること**を確認する(緑になる設定は無意味):

- `docs/` の Markdown に既知の typo を 1 語入れて `check:spelling` が落ちる
- ある unit の `@playwright/test` を `catalog:` から literal に戻して
  `check:deps` が落ちる
- `tools/lib/` から `test/` を import して `check:architecture` が落ちる
- Next unit に大きな client component を追加して `check:size` が落ちる

いずれも確認後 revert する。

**local = CI の確認**

`.github/workflows/integration.yaml` の全 `run:` 行が、
`pnpm install --frozen-lockfile` / `pnpm run <script>` /
`pnpm -C <dir> run <script>` / `node tools/check-workers.mjs` の
いずれかであること(ツール固有 flag が YAML に無いこと)を grep で確認する。

---

## 明示的に今回やらないこと

- Knip `--fix` による自動削除(禁止)
- dependency-cruiser による **TypeScript** 層の architecture 強制
  (ツール側が TS7 を読めない。実測済み)
- Size Limit の pre-push 統合(20 unit の build が前提)
- Playwright の CI 追加(既存の意図的な穴、scope 外)
- Sherif
