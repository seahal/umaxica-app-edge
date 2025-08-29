import type { Route } from "./+types/about";
import { use, Suspense } from "react";

// メタ情報の責務: About ページのSEO対応メタデータを定義
// テストではこう確認する: title と description が正しく設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "About Us - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaの会社概要、ミッション、ビジョン、そして私たちのチームについてご紹介します。",
		},
	];
}

// 会社情報を非同期で取得するPromise（React 19のuse()デモのため）
// この部分はデータ取得の責務: 会社情報を非同期で取得
// テストではこう確認する: Promise が正しく解決され、適切なデータが返されるかをテスト
function createCompanyInfoPromise() {
	return new Promise<{
		founded: number;
		employees: number;
		locations: string[];
		certifications: string[];
	}>((resolve) => {
		// 実際のAPIコールをシミュレート
		setTimeout(() => {
			resolve({
				founded: 2014,
				employees: 25,
				locations: ["東京", "大阪", "福岡"],
				certifications: ["ISO 27001", "プライバシーマーク", "AWS Partner"],
			});
		}, 100);
	});
}

// React 19のuse()フックを使用したコンポーネント
// この部分はデータ表示の責務: 取得した会社情報を表示
// テストではこう確認する: use() フックが正しく動作し、データが適切に表示されるかをテスト
function CompanyStats() {
	const companyInfo = use(createCompanyInfoPromise());

	return (
		<div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
			<div className="text-center">
				<div className="text-3xl font-bold text-blue-600">
					{new Date().getFullYear() - companyInfo.founded}
				</div>
				<div className="mt-2 text-sm text-gray-600">年の実績</div>
			</div>
			<div className="text-center">
				<div className="text-3xl font-bold text-blue-600">
					{companyInfo.employees}
				</div>
				<div className="mt-2 text-sm text-gray-600">チームメンバー</div>
			</div>
			<div className="text-center">
				<div className="text-3xl font-bold text-blue-600">
					{companyInfo.locations.length}
				</div>
				<div className="mt-2 text-sm text-gray-600">拠点</div>
			</div>
			<div className="text-center">
				<div className="text-3xl font-bold text-blue-600">
					{companyInfo.certifications.length}
				</div>
				<div className="mt-2 text-sm text-gray-600">認定資格</div>
			</div>
		</div>
	);
}

// About ページメインコンポーネント
// この部分は全体構成の責務: About ページの全体的なレイアウトとコンテンツを定義
// テストではこう確認する: 全セクションが正しくレンダリングされ、Suspense が適切に動作するかをテスト
export default function About() {
	return (
		<div className="bg-white">
			{/* ヒーローセクション */}
			<div className="relative bg-gray-50 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
							私たちについて
						</h1>
						<p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
							テクノロジーの力でビジネスの未来を創造する。それが私たちUmaxicaのミッションです。
						</p>
					</div>
				</div>
			</div>

			{/* 統計情報セクション（React 19のuse()を使用） */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<Suspense
						fallback={
							<div className="animate-pulse">
								<div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
									{["s1", "s2", "s3", "s4"].map((id) => (
										<div key={id} className="text-center">
											<div className="h-8 bg-gray-200 rounded mb-2"></div>
											<div className="h-4 bg-gray-200 rounded"></div>
										</div>
									))}
								</div>
							</div>
						}
					>
						<CompanyStats />
					</Suspense>
				</div>
			</div>

			{/* ミッション・ビジョンセクション */}
			<div className="bg-gray-50 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-extrabold text-gray-900">
							ミッション・ビジョン
						</h2>
					</div>
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						{/* ミッションセクションの責務: 会社の使命を明確に伝える */}
						<div className="bg-white p-8 rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-gray-900 mb-4">
								🎯 ミッション
							</h3>
							<p className="text-gray-600 leading-relaxed">
								最先端のテクノロジーを活用し、お客様のビジネス課題を解決することで、
								デジタル社会の発展に貢献します。私たちは常にイノベーションを追求し、
								お客様と共に成長することを目指します。
							</p>
						</div>
						{/* ビジョンセクションの責務: 会社の将来像を示す */}
						<div className="bg-white p-8 rounded-lg shadow-md">
							<h3 className="text-xl font-semibold text-gray-900 mb-4">
								🚀 ビジョン
							</h3>
							<p className="text-gray-600 leading-relaxed">
								テクノロジーとクリエイティビティの融合により、世界中の企業が
								デジタルトランスフォーメーションを成功させるためのパートナーとして、
								業界をリードする存在になることを目指します。
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* バリュー（価値観）セクション */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-extrabold text-gray-900">
							私たちの価値観
						</h2>
					</div>
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{/* 各価値観の責務: 会社の文化と行動指針を示す */}
						{[
							{
								icon: "💡",
								title: "イノベーション",
								description:
									"常に新しい技術や手法を探求し、革新的なソリューションを提供します。",
							},
							{
								icon: "🤝",
								title: "パートナーシップ",
								description:
									"お客様との信頼関係を大切にし、長期的なパートナーとして共に成長します。",
							},
							{
								icon: "🎯",
								title: "品質重視",
								description:
									"妥協のない品質で、お客様の期待を超える成果を生み出します。",
							},
							{
								icon: "🌱",
								title: "持続可能性",
								description:
									"環境と社会に配慮した事業運営を行い、持続可能な社会の実現に貢献します。",
							},
							{
								icon: "📚",
								title: "学習文化",
								description:
									"継続的な学習と改善を通じて、個人とチーム全体のスキル向上を目指します。",
							},
							{
								icon: "🌍",
								title: "グローバル視点",
								description:
									"世界規模での視野を持ち、国境を超えた価値創造を実現します。",
							},
						].map((value) => (
							<div key={value.title} className="text-center">
								<div className="text-4xl mb-4">{value.icon}</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{value.title}
								</h3>
								<p className="text-gray-600">{value.description}</p>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* チーム紹介セクション */}
			<div className="bg-gray-50 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-extrabold text-gray-900">
							私たちのチーム
						</h2>
						<p className="mt-4 text-xl text-gray-600">
							多様なバックグラウンドを持つプロフェッショナルが集結しています。
						</p>
					</div>
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{/* チームメンバーの責務: 会社の人的リソースと専門性を表現 */}
						{[
							{
								role: "エンジニア",
								count: 12,
								description: "フルスタック開発者",
							},
							{ role: "デザイナー", count: 4, description: "UI/UX専門家" },
							{
								role: "プロジェクトマネージャー",
								count: 5,
								description: "プロジェクト推進",
							},
							{ role: "コンサルタント", count: 4, description: "ビジネス戦略" },
						].map((team) => (
							<div
								key={team.role}
								className="bg-white p-6 rounded-lg shadow-md text-center"
							>
								<div className="text-2xl font-bold text-blue-600 mb-2">
									{team.count}名
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									{team.role}
								</h3>
								<p className="text-gray-600 text-sm">{team.description}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
