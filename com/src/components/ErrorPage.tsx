import { Link } from "react-router";

// エラーページのプロパティ型定義
// この部分は型安全性の責務: エラー情報を安全に扱うためのインターフェース定義
// テストではこう確認する: 型定義が正しく適用され、不正な値が渡されないかをテスト
interface ErrorPageProps {
	status: number;
	title: string;
	message: string;
	suggestion?: string;
	showNavigation?: boolean;
	showDetails?: boolean;
	details?: string;
	stack?: string;
}

// エラーページのアイコン取得関数
// この部分はUI表現の責務: エラーの種類に応じた適切なアイコンを提供
// テストではこう確認する: 各ステータスコードに対して正しいアイコンが返されるかをテスト
function getErrorIcon(status: number): string {
	switch (status) {
		case 404:
			return "🔍"; // 見つからない
		case 500:
			return "⚠️"; // サーバーエラー
		case 503:
			return "🚧"; // メンテナンス
		default:
			return "❌"; // 一般的なエラー
	}
}

// メインのエラーページコンポーネント
// この部分はエラー表示の責務: ユーザーに分かりやすくエラー状況を説明
// テストではこう確認する: 各プロパティが正しくレンダリングされ、適切なリンクが表示されるかをテスト
export function ErrorPage({
	status,
	title,
	message,
	suggestion,
	showNavigation = true,
	showDetails = false,
	details,
	stack,
}: ErrorPageProps) {
	const icon = getErrorIcon(status);
	const isClientError = status >= 400 && status < 500;
	const isServerError = status >= 500;

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8 text-center">
				{/* エラーアイコンと状態表示 */}
				<div>
					<div className="text-6xl mb-4">{icon}</div>
					<h1 className="text-6xl font-bold text-gray-900 mb-2">{status}</h1>
					<h2 className="text-2xl font-bold text-gray-700 mb-4">{title}</h2>
				</div>

				{/* エラーメッセージ */}
				<div className="space-y-4">
					<p className="text-lg text-gray-600 leading-relaxed">{message}</p>

					{suggestion && (
						<p className="text-md text-gray-500 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
							💡 <strong>提案:</strong> {suggestion}
						</p>
					)}
				</div>

				{/* ナビゲーションボタン */}
				{showNavigation && (
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/"
								className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
							>
								🏠 ホームに戻る
							</Link>

							<button
								type="button"
								onClick={() => window.history.back()}
								className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
							>
								← 前のページに戻る
							</button>
						</div>

						{/* よく見られるページへのリンク */}
						<div className="mt-8">
							<h3 className="text-sm font-medium text-gray-700 mb-3">
								よく見られるページ
							</h3>
							<div className="flex flex-wrap gap-2 justify-center">
								<Link
									to="/about"
									className="text-sm text-blue-600 hover:text-blue-800 underline"
								>
									会社概要
								</Link>
								<span className="text-gray-400">•</span>
								<Link
									to="/services"
									className="text-sm text-blue-600 hover:text-blue-800 underline"
								>
									サービス
								</Link>
								<span className="text-gray-400">•</span>
								<Link
									to="/contact"
									className="text-sm text-blue-600 hover:text-blue-800 underline"
								>
									お問い合わせ
								</Link>
							</div>
						</div>
					</div>
				)}

				{/* 技術的詳細（開発環境のみ） */}
				{showDetails && (details || stack) && (
					<div className="mt-8 text-left bg-gray-100 p-4 rounded-lg">
						<h3 className="text-sm font-medium text-gray-700 mb-2">
							技術的詳細
						</h3>
						{details && <p className="text-sm text-gray-600 mb-2">{details}</p>}
						{stack && (
							<pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
								{stack}
							</pre>
						)}
					</div>
				)}

				{/* フッター情報 */}
				<div className="text-xs text-gray-400 space-y-2">
					<p>
						何度もこのエラーが発生する場合は、お手数ですがお問い合わせください。
					</p>
					{isServerError && (
						<p className="text-red-500">
							サーバーで問題が発生しています。しばらく時間をおいて再度お試しください。
						</p>
					)}
					{isClientError && status === 404 && (
						<p>
							URLが正しいか確認するか、上記のリンクから目的のページをお探しください。
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

// 404エラー専用コンポーネント
// この部分は404エラー表示の責務: ページが見つからない場合の専用UI
// テストではこう確認する: 404専用のメッセージとリンクが正しく表示されるかをテスト
// 404/500 専用コンポーネントは別ファイルに分離しました

// 503メンテナンス専用コンポーネント
// この部分はメンテナンス表示の責務: サービスメンテナンス中の専用UI
// テストではこう確認する: メンテナンス情報が適切に表示され、ユーザーに適切な案内をするかをテスト
export function ServiceUnavailablePage() {
	return (
		<ErrorPage
			status={503}
			title="メンテナンス中"
			message="現在システムメンテナンスを実施しています。ご不便をおかけして申し訳ございません。"
			suggestion="しばらく時間をおいてから再度アクセスしてください。"
			showNavigation={false}
		/>
	);
}
