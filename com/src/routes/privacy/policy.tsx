import { Link } from "react-router";
import { useId } from "react";
import type { Route } from "./+types/policy";

// メタ情報の責務: プライバシーポリシー詳細ページのSEO対応メタデータを定義
// テストではこう確認する: titleとdescriptionが適切に設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "プライバシーポリシー詳細 - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaの個人情報保護方針の詳細。収集する情報、利用目的、保護措置、お客様の権利について詳しく説明します。",
		},
	];
}

// プライバシーポリシー詳細ページのメインコンポーネント
// この部分はプライバシーポリシー表示の責務: 詳細な個人情報保護方針を提供
// テストではこう確認する: 各セクションが適切に表示され、リンクが正しく機能するかをテスト
export default function PrivacyPolicy() {
	const baseId = useId();
	const ids = {
		basicPolicy: `${baseId}-basic-policy`,
		collectedInfo: `${baseId}-collected-info`,
		usagePurpose: `${baseId}-usage-purpose`,
		protectionMeasures: `${baseId}-protection-measures`,
		thirdParty: `${baseId}-third-party`,
		userRights: `${baseId}-user-rights`,
		cookies: `${baseId}-cookies`,
		contact: `${baseId}-contact`,
	};
	return (
		<div>
			{/* ページヘッダー */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
					<span className="mr-3">📋</span>
					プライバシーポリシー詳細
				</h1>
				<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
					<p className="text-blue-800 text-sm">
						<span className="font-semibold">最終更新日: 2024年12月25日</span> |
						<span className="ml-2">施行日: 2024年1月1日</span>
					</p>
				</div>
			</div>

			{/* 目次セクション */}
			<div className="bg-gray-50 p-6 rounded-lg mb-8">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">目次</h2>
				<nav className="grid md:grid-cols-2 gap-2">
					<a
						href={`#${ids.basicPolicy}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						1. 基本方針
					</a>
					<a
						href={`#${ids.collectedInfo}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						2. 収集する情報
					</a>
					<a
						href={`#${ids.usagePurpose}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						3. 利用目的
					</a>
					<a
						href={`#${ids.protectionMeasures}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						4. 保護措置
					</a>
					<a
						href={`#${ids.thirdParty}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						5. 第三者提供
					</a>
					<a
						href={`#${ids.userRights}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						6. お客様の権利
					</a>
					<a
						href={`#${ids.cookies}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						7. Cookie等について
					</a>
					<a
						href={`#${ids.contact}`}
						className="text-blue-600 hover:text-blue-800 hover:underline"
					>
						8. お問い合わせ
					</a>
				</nav>
			</div>

			{/* 基本方針セクション */}
			<section id={ids.basicPolicy} className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4 border-l-4 border-blue-500 pl-4">
					1. 基本方針
				</h2>
				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-4 leading-relaxed">
						株式会社Umaxica（以下「当社」）は、個人情報保護法をはじめとする個人情報保護に関する法令等を遵守し、
						お客様の個人情報を適切に取り扱うことを宣言いたします。
					</p>
					<div className="bg-blue-50 p-4 rounded-lg">
						<h3 className="font-semibold text-blue-900 mb-2">私たちの約束</h3>
						<ul className="text-blue-800 text-sm space-y-1">
							<li>• 必要最小限の情報のみを収集します</li>
							<li>• 明確な目的のためにのみ使用します</li>
							<li>• 適切なセキュリティ対策を講じます</li>
							<li>• お客様の権利を尊重します</li>
						</ul>
					</div>
				</div>
			</section>

			{/* 収集する情報セクション */}
			<section id={ids.collectedInfo} className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4 border-l-4 border-green-500 pl-4">
					2. 収集する情報
				</h2>
				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-4">
						当社では、サービス提供のために以下の個人情報を収集させていただく場合があります：
					</p>
					<div className="grid md:grid-cols-2 gap-6">
						<div className="bg-green-50 p-4 rounded-lg">
							<h3 className="font-semibold text-green-900 mb-3 flex items-center">
								<span className="mr-2">👤</span>
								基本情報
							</h3>
							<ul className="text-green-800 text-sm space-y-1">
								<li>• 氏名、フリガナ</li>
								<li>• メールアドレス</li>
								<li>• 電話番号</li>
								<li>• 住所</li>
							</ul>
						</div>
						<div className="bg-orange-50 p-4 rounded-lg">
							<h3 className="font-semibold text-orange-900 mb-3 flex items-center">
								<span className="mr-2">💻</span>
								技術情報
							</h3>
							<ul className="text-orange-800 text-sm space-y-1">
								<li>• IPアドレス</li>
								<li>• ブラウザ情報</li>
								<li>• アクセス履歴</li>
								<li>• Cookie情報</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* 利用目的セクション */}
			<section id={ids.usagePurpose} className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4 border-l-4 border-purple-500 pl-4">
					3. 利用目的
				</h2>
				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-4">
						収集した個人情報は、以下の目的のために利用いたします：
					</p>
					<div className="space-y-4">
						<div className="flex items-start">
							<span className="text-purple-600 text-xl mr-3 mt-1">🎯</span>
							<div>
								<h4 className="font-semibold text-gray-900">サービス提供</h4>
								<p className="text-gray-600 text-sm">
									お客様にサービスを提供し、サポートを行うため
								</p>
							</div>
						</div>
						<div className="flex items-start">
							<span className="text-purple-600 text-xl mr-3 mt-1">📧</span>
							<div>
								<h4 className="font-semibold text-gray-900">連絡・通知</h4>
								<p className="text-gray-600 text-sm">
									重要なお知らせやサービス情報をお伝えするため
								</p>
							</div>
						</div>
						<div className="flex items-start">
							<span className="text-purple-600 text-xl mr-3 mt-1">📊</span>
							<div>
								<h4 className="font-semibold text-gray-900">サービス改善</h4>
								<p className="text-gray-600 text-sm">
									サービスの品質向上と新機能開発のため
								</p>
							</div>
						</div>
						<div className="flex items-start">
							<span className="text-purple-600 text-xl mr-3 mt-1">🔍</span>
							<div>
								<h4 className="font-semibold text-gray-900">調査・分析</h4>
								<p className="text-gray-600 text-sm">
									統計的分析によるサービス最適化のため
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* 保護措置セクション */}
			<section id={ids.protectionMeasures} className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4 border-l-4 border-red-500 pl-4">
					4. 保護措置
				</h2>
				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-6">
						当社では、個人情報の安全性を確保するため、以下の技術的・組織的措置を講じています：
					</p>
					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<h3 className="font-semibold text-red-900 mb-3 flex items-center">
								<span className="mr-2">🔒</span>
								技術的措置
							</h3>
							<ul className="text-gray-600 text-sm space-y-2">
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									SSL/TLS暗号化による通信保護
								</li>
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									アクセス制御とファイアウォール
								</li>
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									定期的なセキュリティ監査
								</li>
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									データバックアップと冗長化
								</li>
							</ul>
						</div>
						<div>
							<h3 className="font-semibold text-red-900 mb-3 flex items-center">
								<span className="mr-2">👥</span>
								組織的措置
							</h3>
							<ul className="text-gray-600 text-sm space-y-2">
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									個人情報保護責任者の設置
								</li>
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									従業員への定期的な教育研修
								</li>
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									アクセス権限の厳格な管理
								</li>
								<li className="flex items-start">
									<span className="text-red-500 mr-2">•</span>
									インシデント対応体制の整備
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* お客様の権利セクション */}
			<section id={ids.userRights} className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4 border-l-4 border-yellow-500 pl-4">
					6. お客様の権利
				</h2>
				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-6">
						お客様には、ご自身の個人情報について以下の権利があります：
					</p>
					<div className="space-y-4">
						<div className="bg-yellow-50 p-4 rounded-lg">
							<div className="flex items-center mb-2">
								<span className="text-yellow-600 text-xl mr-3">👁️</span>
								<h4 className="font-semibold text-yellow-900">開示請求権</h4>
							</div>
							<p className="text-yellow-800 text-sm ml-10">
								当社が保有するお客様の個人情報について、開示をご請求いただけます。
							</p>
						</div>
						<div className="bg-blue-50 p-4 rounded-lg">
							<div className="flex items-center mb-2">
								<span className="text-blue-600 text-xl mr-3">✏️</span>
								<h4 className="font-semibold text-blue-900">訂正・削除権</h4>
							</div>
							<p className="text-blue-800 text-sm ml-10">
								個人情報の内容が事実でない場合、訂正・削除をご請求いただけます。
							</p>
						</div>
						<div className="bg-green-50 p-4 rounded-lg">
							<div className="flex items-center mb-2">
								<span className="text-green-600 text-xl mr-3">⏸️</span>
								<h4 className="font-semibold text-green-900">利用停止権</h4>
							</div>
							<p className="text-green-800 text-sm ml-10">
								個人情報の利用停止をご希望の場合、ご請求いただけます。
							</p>
						</div>
					</div>
					<div className="mt-6 bg-gray-50 p-4 rounded-lg">
						<p className="text-gray-700 text-sm mb-2">
							権利行使のお手続きについては、
							<Link
								to="/privacy/docs"
								className="text-blue-600 hover:text-blue-800 underline mx-1"
							>
								関連ドキュメント
							</Link>
							をご確認いただくか、下記お問い合わせ窓口までご連絡ください。
						</p>
					</div>
				</div>
			</section>

			{/* お問い合わせセクション */}
			<section id={ids.contact} className="mb-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4 border-l-4 border-blue-500 pl-4">
					8. お問い合わせ
				</h2>
				<div className="bg-white p-6 rounded-lg border border-gray-200">
					<p className="text-gray-700 mb-6">
						個人情報の取り扱いに関するお問い合わせは、以下の窓口までご連絡ください：
					</p>
					<div className="bg-blue-50 p-4 rounded-lg mb-6">
						<h3 className="font-semibold text-blue-900 mb-3">
							個人情報お問い合わせ窓口
						</h3>
						<div className="text-blue-800 text-sm space-y-1">
							<p>
								<span className="font-medium">担当部署：</span>{" "}
								個人情報保護委員会
							</p>
							<p>
								<span className="font-medium">メール：</span>{" "}
								privacy@umaxica.com
							</p>
							<p>
								<span className="font-medium">電話：</span> 03-1234-5678（平日
								9:00-17:00）
							</p>
						</div>
					</div>
					<div className="flex gap-4">
						<Link
							to="/contact"
							className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
						>
							<span className="mr-2">📧</span>
							お問い合わせフォーム
						</Link>
						<Link
							to="/privacy"
							className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
						>
							<span className="mr-2">←</span>
							プライバシートップに戻る
						</Link>
					</div>
				</div>
			</section>

			{/* フッター情報 */}
			<div className="bg-gray-100 p-4 rounded-lg text-center text-sm text-gray-600">
				<p>
					このプライバシーポリシーは、法令の改正やサービス内容の変更に伴い、
					予告なく変更する場合があります。
				</p>
				<p className="mt-2">
					変更があった場合は、
					<Link
						to="/privacy"
						className="text-blue-600 hover:text-blue-800 underline"
					>
						プライバシーページ
					</Link>
					でお知らせいたします。
				</p>
			</div>
		</div>
	);
}
