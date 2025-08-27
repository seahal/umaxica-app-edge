import { Link } from "react-router";
import type { Route } from "../../../src/routes/privacy/+types/index";

// メタ情報の責務: プライバシー概要ページのSEO対応メタデータを定義
// テストではこう確認する: titleとdescriptionが適切に設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "プライバシー概要 - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaの個人情報保護への取り組みと、プライバシーポリシーの概要をご紹介します。",
		},
	];
}

// プライバシー概要ページのメインコンポーネント
// この部分はプライバシー情報表示の責務: プライバシー関連情報の概要とナビゲーションを提供
// テストではこう確認する: 各セクションが適切に表示され、リンクが正しく機能するかをテスト
export default function PrivacyIndex() {
	return (
		<div>
			{/* ページヘッダー */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
					<span className="mr-3">🔐</span>
					プライバシーとデータ保護について
				</h1>
				<p className="text-lg text-gray-600 leading-relaxed">
					Umaxicaでは、お客様の個人情報保護を最優先に考え、
					法令遵守と透明性のあるデータ管理を実践しています。
				</p>
			</div>

			{/* 主要なプライバシー情報カード */}
			<div className="grid md:grid-cols-2 gap-6 mb-8">
				{/* プライバシーポリシーカード */}
				<div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
					<div className="flex items-center mb-4">
						<span className="text-2xl mr-3">📋</span>
						<h2 className="text-xl font-semibold text-blue-900">
							プライバシーポリシー
						</h2>
					</div>
					<p className="text-blue-800 mb-4">
						個人情報の取り扱いに関する詳細な方針と、お客様の権利について説明しています。
					</p>
					{/* Linkコンポーネントのデモ: プライマリCTAとしての使用例 */}
					<Link
						to="/privacy/policy"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
					>
						詳細を確認する
						<span className="ml-2">→</span>
					</Link>
				</div>

				{/* 関連ドキュメントカード */}
				<div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
					<div className="flex items-center mb-4">
						<span className="text-2xl mr-3">📚</span>
						<h2 className="text-xl font-semibold text-green-900">
							関連ドキュメント
						</h2>
					</div>
					<p className="text-green-800 mb-4">
						プライバシーに関する追加資料、FAQ、データ保護に関する技術的な説明をご覧いただけます。
					</p>
					{/* Linkコンポーネントのデモ: セカンダリCTAとしての使用例 */}
					<Link
						to="/privacy/docs"
						className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
					>
						ドキュメントを見る
						<span className="ml-2">📄</span>
					</Link>
				</div>
			</div>

			{/* プライバシー保護の取り組み */}
			<div className="bg-gray-50 p-6 rounded-lg mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
					<span className="mr-3">🛡️</span>
					私たちの取り組み
				</h2>

				<div className="grid md:grid-cols-3 gap-6">
					<div className="text-center">
						<div className="text-4xl mb-3">🔒</div>
						<h3 className="font-semibold text-gray-900 mb-2">暗号化</h3>
						<p className="text-sm text-gray-600">
							全てのデータ通信と保存データに最新の暗号化技術を使用
						</p>
					</div>

					<div className="text-center">
						<div className="text-4xl mb-3">🎯</div>
						<h3 className="font-semibold text-gray-900 mb-2">最小限の収集</h3>
						<p className="text-sm text-gray-600">
							サービス提供に必要最小限の情報のみを収集
						</p>
					</div>

					<div className="text-center">
						<div className="text-4xl mb-3">👤</div>
						<h3 className="font-semibold text-gray-900 mb-2">ユーザー制御</h3>
						<p className="text-sm text-gray-600">
							お客様が自分の情報を管理・削除できる機能を提供
						</p>
					</div>
				</div>
			</div>

			{/* よくある質問セクション */}
			<div className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
					<span className="mr-3">❓</span>
					よくある質問
				</h2>

				<div className="space-y-4">
					<details className="bg-white p-4 rounded-lg border border-gray-200">
						<summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
							個人情報はどのように保護されていますか？
						</summary>
						<div className="mt-3 text-gray-600">
							<p className="mb-2">
								私たちは業界標準の暗号化技術とセキュリティプロトコルを使用して、
								お客様の個人情報を保護しています。
							</p>
							<p>
								詳細については、
								<Link
									to="/privacy/policy"
									className="text-blue-600 hover:text-blue-800 underline"
								>
									プライバシーポリシー
								</Link>
								をご確認ください。
							</p>
						</div>
					</details>

					<details className="bg-white p-4 rounded-lg border border-gray-200">
						<summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
							自分の情報を削除することはできますか？
						</summary>
						<div className="mt-3 text-gray-600">
							<p className="mb-2">
								はい、お客様にはご自身の個人情報の削除を要求する権利があります。
							</p>
							<p>
								削除手続きの詳細は、
								<Link
									to="/privacy/docs"
									className="text-blue-600 hover:text-blue-800 underline"
								>
									関連ドキュメント
								</Link>
								でご確認いただけます。
							</p>
						</div>
					</details>

					<details className="bg-white p-4 rounded-lg border border-gray-200">
						<summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
							第三者と情報を共有することはありますか？
						</summary>
						<div className="mt-3 text-gray-600">
							<p>
								お客様の同意なしに第三者と個人情報を共有することはありません。
								例外的なケースについては、プライバシーポリシーで明確に説明しています。
							</p>
						</div>
					</details>
				</div>
			</div>

			{/* お問い合わせセクション */}
			<div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
				<div className="flex items-start">
					<span className="text-2xl mr-4 mt-1">💬</span>
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-yellow-900 mb-2">
							プライバシーに関するご質問
						</h3>
						<p className="text-yellow-800 mb-4">
							プライバシーポリシーや個人情報の取り扱いについてご質問やご不明な点がございましたら、
							お気軽にお問い合わせください。
						</p>
						{/* Linkコンポーネントのデモ: 外部ページへのナビゲーション */}
						<Link
							to="/contact"
							className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium"
						>
							<span className="mr-2">📧</span>
							お問い合わせフォーム
						</Link>
					</div>
				</div>
			</div>

			{/* 更新情報 */}
			<div className="mt-8 text-center text-sm text-gray-500">
				<p>このページの情報は定期的に更新されます。</p>
				<p className="mt-1">最終更新: 2024年12月</p>
			</div>
		</div>
	);
}
