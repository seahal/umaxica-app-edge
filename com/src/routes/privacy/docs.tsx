import { Link } from "react-router";
import { useId } from "react";
import type { Route } from "./+types/docs";

// メタ情報の責務: プライバシー関連ドキュメントページのSEO対応メタデータを定義
// テストではこう確認する: titleとdescriptionが適切に設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "プライバシー関連ドキュメント - Umaxica" },
		{
			name: "description",
			content:
				"個人情報保護に関するFAQ、データ削除手順、セキュリティ対策の詳細など、プライバシー関連の追加資料をご覧いただけます。",
		},
	];
}

// プライバシー関連ドキュメントページのメインコンポーネント
// この部分はドキュメント表示の責務: プライバシー関連の追加資料とリソースを提供
// テストではこう確認する: 各ドキュメントセクションが適切に表示され、ナビゲーションが機能するかをテスト
export default function PrivacyDocs() {
	const baseId = useId();
	const ids = {
		faq: `${baseId}-faq`,
		deletionGuide: `${baseId}-deletion-guide`,
		securityDetails: `${baseId}-security-details`,
		legalBasis: `${baseId}-legal-basis`,
		dataRetention: `${baseId}-data-retention`,
		contactProcedures: `${baseId}-contact-procedures`,
	};
	return (
		<div>
			{/* ページヘッダー */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
					<span className="mr-3">📚</span>
					プライバシー関連ドキュメント
				</h1>
				<p className="text-lg text-gray-600">
					個人情報保護に関する詳細資料、よくある質問、手続き方法などをまとめています。
				</p>
			</div>

			{/* クイックナビゲーション */}
			<div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-200">
				<h2 className="text-lg font-semibold text-blue-900 mb-4">
					ドキュメント一覧
				</h2>
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
					<a
						href={`#${ids.faq}`}
						className="flex items-center text-blue-700 hover:text-blue-900 hover:underline transition-colors"
					>
						<span className="mr-2">❓</span>よくある質問
					</a>
					<a
						href={`#${ids.deletionGuide}`}
						className="flex items-center text-blue-700 hover:text-blue-900 hover:underline transition-colors"
					>
						<span className="mr-2">🗑️</span>データ削除手順
					</a>
					<a
						href={`#${ids.securityDetails}`}
						className="flex items-center text-blue-700 hover:text-blue-900 hover:underline transition-colors"
					>
						<span className="mr-2">🔐</span>セキュリティ詳細
					</a>
					<a
						href={`#${ids.legalBasis}`}
						className="flex items-center text-blue-700 hover:text-blue-900 hover:underline transition-colors"
					>
						<span className="mr-2">⚖️</span>法的根拠
					</a>
					<a
						href={`#${ids.dataRetention}`}
						className="flex items-center text-blue-700 hover:text-blue-900 hover:underline transition-colors"
					>
						<span className="mr-2">🗃️</span>データ保持期間
					</a>
					<a
						href={`#${ids.contactProcedures}`}
						className="flex items-center text-blue-700 hover:text-blue-900 hover:underline transition-colors"
					>
						<span className="mr-2">📞</span>お問い合わせ手順
					</a>
				</div>
			</div>

			{/* よくある質問セクション */}
			<section id={ids.faq} className="mb-10">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center border-l-4 border-green-500 pl-4">
					<span className="mr-3">❓</span>
					よくある質問（FAQ）
				</h2>

				<div className="space-y-6">
					<div className="bg-white rounded-lg border border-gray-200">
						<details className="group">
							<summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-gray-900">
										どのような個人情報を収集していますか？
									</h3>
									<span className="text-gray-500 group-open:rotate-180 transition-transform">
										▼
									</span>
								</div>
							</summary>
							<div className="px-6 pb-6 border-t border-gray-100">
								<p className="text-gray-700 mb-4">
									当社では、サービス提供に必要な以下の個人情報を収集しています：
								</p>
								<ul className="text-gray-600 space-y-2 mb-4">
									<li>• 氏名、メールアドレス、電話番号などの基本情報</li>
									<li>• サービス利用履歴、アクセスログ</li>
									<li>• お問い合わせ内容、サポート履歴</li>
								</ul>
								<p className="text-sm text-blue-700">
									詳細は
									<Link
										to="/privacy/policy"
										className="underline hover:text-blue-900"
									>
										プライバシーポリシー
									</Link>
									をご確認ください。
								</p>
							</div>
						</details>
					</div>

					<div className="bg-white rounded-lg border border-gray-200">
						<details className="group">
							<summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-gray-900">
										情報の削除を依頼することはできますか？
									</h3>
									<span className="text-gray-500 group-open:rotate-180 transition-transform">
										▼
									</span>
								</div>
							</summary>
							<div className="px-6 pb-6 border-t border-gray-100">
								<p className="text-gray-700 mb-4">
									はい、お客様にはご自身の個人情報の削除を要求する権利があります。
									削除をご希望の場合は、以下の手順で進めてください：
								</p>
								<ol className="text-gray-600 space-y-2 mb-4">
									<li>1. お問い合わせフォームから削除依頼を送信</li>
									<li>2. 本人確認のための情報を提供</li>
									<li>3. 削除対象の詳細を指定</li>
									<li>4. 当社にて削除処理を実行（通常5営業日以内）</li>
								</ol>
								<p className="text-sm text-blue-700">
									詳しくは
									<a
										href={`#${ids.deletionGuide}`}
										className="underline hover:text-blue-900"
									>
										データ削除手順
									</a>
									をご覧ください。
								</p>
							</div>
						</details>
					</div>

					<div className="bg-white rounded-lg border border-gray-200">
						<details className="group">
							<summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-gray-900">
										第三者と情報を共有することはありますか？
									</h3>
									<span className="text-gray-500 group-open:rotate-180 transition-transform">
										▼
									</span>
								</div>
							</summary>
							<div className="px-6 pb-6 border-t border-gray-100">
								<p className="text-gray-700 mb-4">
									お客様の明示的な同意なしに第三者と個人情報を共有することは原則ありません。
									ただし、以下の場合は例外となります：
								</p>
								<ul className="text-gray-600 space-y-2">
									<li>• 法令に基づく開示が求められた場合</li>
									<li>• 生命、身体の保護のために必要な場合</li>
									<li>• サービス提供に不可欠な業務委託先との共有</li>
								</ul>
							</div>
						</details>
					</div>
				</div>
			</section>

			{/* データ削除手順セクション */}
			<section id={ids.deletionGuide} className="mb-10">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center border-l-4 border-red-500 pl-4">
					<span className="mr-3">🗑️</span>
					データ削除手順
				</h2>

				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-6">
						お客様の個人情報の削除をご希望の場合は、以下の手順に従って進めてください。
					</p>

					<div className="space-y-6">
						<div className="flex items-start">
							<div className="bg-red-100 text-red-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 mt-1 flex-shrink-0">
								1
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">
									削除依頼の送信
								</h3>
								<p className="text-gray-700 mb-3">
									以下のいずれかの方法で削除依頼をお送りください：
								</p>
								<div className="grid md:grid-cols-2 gap-4">
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-medium text-gray-900 mb-2">
											オンラインフォーム
										</h4>
										<Link
											to="/contact"
											className="inline-flex items-center text-blue-600 hover:text-blue-800 underline text-sm"
										>
											<span className="mr-1">📧</span>
											お問い合わせフォーム
										</Link>
									</div>
									<div className="bg-gray-50 p-4 rounded-lg">
										<h4 className="font-medium text-gray-900 mb-2">メール</h4>
										<p className="text-gray-700 text-sm">privacy@umaxica.com</p>
									</div>
								</div>
							</div>
						</div>

						<div className="flex items-start">
							<div className="bg-red-100 text-red-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 mt-1 flex-shrink-0">
								2
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">本人確認</h3>
								<p className="text-gray-700 mb-3">
									個人情報保護のため、以下の情報で本人確認を行います：
								</p>
								<ul className="text-gray-600 space-y-1 text-sm">
									<li>• 登録時のメールアドレス</li>
									<li>• 氏名、生年月日</li>
									<li>• アカウント作成日（わかる範囲で）</li>
								</ul>
							</div>
						</div>

						<div className="flex items-start">
							<div className="bg-red-100 text-red-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 mt-1 flex-shrink-0">
								3
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">
									削除処理の実行
								</h3>
								<p className="text-gray-700 mb-3">
									本人確認完了後、通常5営業日以内に削除処理を実行します。
								</p>
								<div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
									<p className="text-yellow-800 text-sm">
										<span className="font-semibold">ご注意：</span>
										法令により保存が義務付けられている情報は、所定の期間が経過するまで削除できない場合があります。
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-start">
							<div className="bg-red-100 text-red-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 mt-1 flex-shrink-0">
								4
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-2">完了通知</h3>
								<p className="text-gray-700">
									削除処理完了後、登録メールアドレス宛に完了通知をお送りします。
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* セキュリティ詳細セクション */}
			<section id={ids.securityDetails} className="mb-10">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center border-l-4 border-blue-500 pl-4">
					<span className="mr-3">🔐</span>
					セキュリティ対策の詳細
				</h2>

				<div className="grid md:grid-cols-2 gap-6">
					<div className="bg-white p-6 rounded-lg border border-gray-200">
						<h3 className="font-semibold text-blue-900 mb-4 flex items-center">
							<span className="mr-2">🌐</span>
							通信セキュリティ
						</h3>
						<ul className="text-gray-700 space-y-3 text-sm">
							<li className="flex items-start">
								<span className="text-blue-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">TLS 1.3暗号化：</span>
									全ての通信を最新の暗号化技術で保護
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-blue-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">証明書検証：</span>
									定期的なSSL証明書の更新と検証
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-blue-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">HSTS対応：</span>
									強制的なHTTPS通信の実装
								</div>
							</li>
						</ul>
					</div>

					<div className="bg-white p-6 rounded-lg border border-gray-200">
						<h3 className="font-semibold text-green-900 mb-4 flex items-center">
							<span className="mr-2">🏦</span>
							データ保存セキュリティ
						</h3>
						<ul className="text-gray-700 space-y-3 text-sm">
							<li className="flex items-start">
								<span className="text-green-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">AES-256暗号化：</span>
									保存データの強力な暗号化
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-green-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">アクセス制御：</span>
									役割ベースの厳格な権限管理
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-green-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">監査ログ：</span>
									全てのアクセスを記録・監視
								</div>
							</li>
						</ul>
					</div>

					<div className="bg-white p-6 rounded-lg border border-gray-200">
						<h3 className="font-semibold text-purple-900 mb-4 flex items-center">
							<span className="mr-2">🛡️</span>
							脅威対策
						</h3>
						<ul className="text-gray-700 space-y-3 text-sm">
							<li className="flex items-start">
								<span className="text-purple-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">DDoS防御：</span>
									多層防御による攻撃の検知と遮断
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-purple-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">侵入検知：</span>
									24時間体制のセキュリティ監視
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-purple-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">脆弱性対策：</span>
									定期的なセキュリティ診断と修正
								</div>
							</li>
						</ul>
					</div>

					<div className="bg-white p-6 rounded-lg border border-gray-200">
						<h3 className="font-semibold text-orange-900 mb-4 flex items-center">
							<span className="mr-2">👥</span>
							運用セキュリティ
						</h3>
						<ul className="text-gray-700 space-y-3 text-sm">
							<li className="flex items-start">
								<span className="text-orange-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">従業員教育：</span>
									定期的なセキュリティ研修の実施
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-orange-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">インシデント対応：</span>
									24時間対応の緊急事態対策チーム
								</div>
							</li>
							<li className="flex items-start">
								<span className="text-orange-500 mr-2 mt-1">•</span>
								<div>
									<span className="font-medium">認証強化：</span>
									多要素認証によるアクセス管理
								</div>
							</li>
						</ul>
					</div>
				</div>
			</section>

			{/* データ保持期間セクション */}
			<section id={ids.dataRetention} className="mb-10">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center border-l-4 border-yellow-500 pl-4">
					<span className="mr-3">🗃️</span>
					データ保持期間
				</h2>

				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-6">
						個人情報の種類に応じて、以下の期間でデータを保持しています：
					</p>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left py-3 px-4 font-semibold text-gray-900">
										データ種類
									</th>
									<th className="text-left py-3 px-4 font-semibold text-gray-900">
										保持期間
									</th>
									<th className="text-left py-3 px-4 font-semibold text-gray-900">
										削除条件
									</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b border-gray-100">
									<td className="py-3 px-4 text-gray-700">アカウント情報</td>
									<td className="py-3 px-4 text-gray-600">
										アカウント削除まで
									</td>
									<td className="py-3 px-4 text-gray-600">
										お客様からの削除依頼時
									</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="py-3 px-4 text-gray-700">サービス利用履歴</td>
									<td className="py-3 px-4 text-gray-600">最大3年間</td>
									<td className="py-3 px-4 text-gray-600">
										保持期間経過後または削除依頼時
									</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="py-3 px-4 text-gray-700">お問い合わせ履歴</td>
									<td className="py-3 px-4 text-gray-600">最大5年間</td>
									<td className="py-3 px-4 text-gray-600">
										法的保存義務終了後
									</td>
								</tr>
								<tr className="border-b border-gray-100">
									<td className="py-3 px-4 text-gray-700">アクセスログ</td>
									<td className="py-3 px-4 text-gray-600">最大1年間</td>
									<td className="py-3 px-4 text-gray-600">
										保持期間経過後自動削除
									</td>
								</tr>
								<tr>
									<td className="py-3 px-4 text-gray-700">法定保存書類</td>
									<td className="py-3 px-4 text-gray-600">
										法令に定められた期間
									</td>
									<td className="py-3 px-4 text-gray-600">法的義務終了後</td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
						<p className="text-yellow-800 text-sm">
							<span className="font-semibold">注意事項：</span>
							法令により保存が義務付けられているデータについては、法定期間中は削除できない場合があります。
							お客様からの削除依頼がある場合は、可能な範囲で速やかに対応いたします。
						</p>
					</div>
				</div>
			</section>

			{/* お問い合わせ手順セクション */}
			<section id={ids.contactProcedures}>
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center border-l-4 border-green-500 pl-4">
					<span className="mr-3">📞</span>
					お問い合わせ手順
				</h2>

				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-6">
						プライバシーに関するお問い合わせやご要望は、以下の手順でお進めください：
					</p>

					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<h3 className="font-semibold text-green-900 mb-4 flex items-center">
								<span className="mr-2">📧</span>
								一般的なお問い合わせ
							</h3>
							<div className="space-y-3">
								<div className="bg-green-50 p-4 rounded-lg">
									<h4 className="font-medium text-green-900 mb-2">
										オンラインフォーム
									</h4>
									<p className="text-green-800 text-sm mb-3">
										24時間受付、通常24時間以内に回答
									</p>
									<Link
										to="/contact"
										className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
									>
										<span className="mr-1">📝</span>
										フォームを開く
									</Link>
								</div>
								<div className="bg-gray-50 p-4 rounded-lg">
									<h4 className="font-medium text-gray-900 mb-2">メール</h4>
									<p className="text-gray-700 text-sm">privacy@umaxica.com</p>
									<p className="text-gray-600 text-xs mt-1">
										平日2営業日以内に回答
									</p>
								</div>
							</div>
						</div>

						<div>
							<h3 className="font-semibold text-blue-900 mb-4 flex items-center">
								<span className="mr-2">🚨</span>
								緊急のお問い合わせ
							</h3>
							<div className="space-y-3">
								<div className="bg-red-50 p-4 rounded-lg border border-red-200">
									<h4 className="font-medium text-red-900 mb-2">緊急連絡先</h4>
									<p className="text-red-800 text-sm mb-2">
										セキュリティインシデント、データ漏洩の疑いなど
									</p>
									<p className="text-red-700 text-sm">
										<span className="font-medium">電話：</span> 03-1234-5678
									</p>
									<p className="text-red-600 text-xs mt-1">
										24時間対応（緊急時のみ）
									</p>
								</div>
								<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
									<h4 className="font-medium text-yellow-900 mb-2">
										権利行使の申請
									</h4>
									<p className="text-yellow-800 text-sm">
										データ開示・削除・訂正の正式申請
									</p>
									<p className="text-yellow-700 text-xs mt-1">
										書面または認証済みメールが必要
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 関連リンクセクション */}
			<div className="mt-12 bg-gray-100 p-6 rounded-lg">
				<h3 className="font-semibold text-gray-900 mb-4 flex items-center">
					<span className="mr-2">🔗</span>
					関連ページ
				</h3>
				<div className="flex flex-wrap gap-4">
					<Link
						to="/privacy"
						className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
					>
						<span className="mr-2">🏠</span>
						プライバシートップ
					</Link>
					<Link
						to="/privacy/policy"
						className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
					>
						<span className="mr-2">📋</span>
						プライバシーポリシー
					</Link>
					<Link
						to="/contact"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						<span className="mr-2">📧</span>
						お問い合わせ
					</Link>
				</div>
			</div>
		</div>
	);
}
