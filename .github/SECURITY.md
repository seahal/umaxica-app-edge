# Security Policy

本リポジトリ（Cloudflare Workers モノレポ: Hono/Honox + Vite）は、ユーザーと開発者の安全を最優先にしています。脆弱性の疑いを見つけた場合は、以下の手順に従って責任ある開示にご協力ください。

## 脆弱性の報告方法

- 公開 Issue や Pull Request では報告しないでください（悪用を防ぐため）。
- GitHub の「Report a vulnerability」（Security Advisories）から非公開で報告してください。
- 可能なら以下の情報を含めてください:
  - 影響範囲（どのワーカー/ホスト/ルートに影響するか）
  - 再現手順（最小構成の手順、リクエスト例、PoC）
  - 期待される挙動と実際の挙動
  - 環境情報（Cloudflare 環境/`bun -v`/ブラウザ等）
  - 参考ログやスタックトレース（秘匿情報は削除）
- 緊急のご連絡が必要な場合は、リポジトリの Security タブから Advisory を作成してください（最も迅速に到達します）。

報告を受領後、できる限り迅速に確認と初期返信を行い、修正計画・公開方針を非公開チャンネルでご相談します。

## サポート対象とブランチ

- サポート対象は `main` ブランチ上の最新コミットおよび最新リリースです。
- 依存関係の更新は `.github/dependabot.yml` により定期的に行います。セキュリティ更新を優先します。

## スコープ（対象範囲）

- 対象: ルート直下の Cloudflare Workers プロジェクト（`app/`, `com/`, `org/`）と関連設定（`wrangler.jsonc`, `vite.config.ts`, `tsconfig.json` など）。


## 事前セルフチェック（推奨）

報告前に再現性を高めるため、以下の手順で最小再現をお願いします。

- 依存関係の再構築: `bun install`
- 型/静的解析: `bun run typecheck`、`bun run lint`
- テスト: `bun test`

## 秘密情報と構成管理
- レポジトリに秘密情報をコミットしないでください。
- 本番/ステージングでは `wrangler secret put <NAME>` で秘密を登録してください。
- Cloudflare Bindings を更新した場合は `bun run cf-typegen` で型を再生成してください。
- ログ・Issue・PR にはトークン/クッキー/鍵/個人情報を含めないでください。

## 運用上の推奨（参考）

- ヘッダ/ブラウザ保護:
  - 適切な Content-Security-Policy（CSP）の設定（SSR/静的リソース双方を考慮）
  - `X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Cross-Origin-Opener-Policy` 等の適用
- 入力検証/エスケープ:
- 依存管理:
  - 余分な権限の削減、脆弱依存の早期アップデート、`biome.json` による静的解析の維持
- 構成の最小権限:
  - Cloudflare Bindings（KV/Queues/D1/Secrets）への最小限アクセス、不要なデバッグ出力の無効化

## ペネトレーション/検証に関する注意

- 破壊的・無許可のスキャンや DoS 行為は行わないでください。
- 再現はローカル（`bun run dev`/`bun run preview`）または自身の Cloudflare アカウント環境でお願いします。

## 開示方針

- 修正が完了するまで、脆弱性の詳細は非公開で取り扱います。
- 公開時期・内容は影響度とユーザー保護を最優先に調整します。
- ご希望があれば、クレジット（謝辞）にお名前/ハンドルを掲載します。
- 現時点でバグバウンティや金銭的報奨は提供していません。

---

このポリシーは運用実態に合わせて随時更新されます。改善提案があれば Issue でお知らせください（機密情報は含めないでください）。
