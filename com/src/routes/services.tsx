import type { Route } from "./+types/services";
import { useState, useTransition, startTransition } from "react";

// メタ情報の責務: Services ページのSEO対応メタデータを定義
// テストではこう確認する: title と description が正しく設定されるかをテスト
export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Services - Umaxica" },
		{
			name: "description",
			content:
				"Umaxicaが提供するWebアプリケーション開発、クラウドソリューション、データ分析・AIサービスをご紹介します。",
		},
	];
}

// サービス詳細データ型定義
// この部分はデータ構造の責務: サービス情報の型安全性を保証
type ServiceDetail = {
	id: string;
	title: string;
	category: string;
	description: string;
	features: string[];
	technologies: string[];
	price: string;
	duration: string;
	icon: string;
};

// サービスデータ
// この部分はデータ管理の責務: 提供するサービスの詳細情報を管理
// テストではこう確認する: 各サービスが必要な項目をすべて持っているかをテスト
const services: ServiceDetail[] = [
	{
		id: "web-development",
		title: "Webアプリケーション開発",
		category: "開発",
		description:
			"React、Next.js、React Routerを使用したモダンなWebアプリケーション開発サービス。高性能で使いやすいユーザーインターフェースを提供します。",
		features: [
			"レスポンシブデザイン対応",
			"SEO最適化",
			"パフォーマンス最適化",
			"アクセシビリティ対応",
			"継続的インテグレーション",
		],
		technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
		price: "¥500,000〜",
		duration: "2-4ヶ月",
		icon: "🚀",
	},
	{
		id: "cloud-solutions",
		title: "クラウドソリューション",
		category: "インフラ",
		description:
			"AWS、Cloudflareを活用したスケーラブルで安全なクラウドインフラストラクチャの設計・構築・運用を提供します。",
		features: [
			"自動スケーリング",
			"災害復旧対応",
			"セキュリティ強化",
			"コスト最適化",
			"監視・アラート機能",
		],
		technologies: ["AWS", "Cloudflare", "Docker", "Kubernetes", "Terraform"],
		price: "¥300,000〜",
		duration: "1-3ヶ月",
		icon: "☁️",
	},
	{
		id: "data-analytics",
		title: "データ分析・AI",
		category: "データサイエンス",
		description:
			"機械学習とデータサイエンスの技術を活用し、ビジネスの成長に繋がるインサイトと自動化ソリューションを提供します。",
		features: [
			"予測分析",
			"異常検知",
			"自然言語処理",
			"画像認識",
			"レコメンデーションシステム",
		],
		technologies: [
			"Python",
			"TensorFlow",
			"scikit-learn",
			"Pandas",
			"AWS SageMaker",
		],
		price: "¥800,000〜",
		duration: "3-6ヶ月",
		icon: "🤖",
	},
	{
		id: "mobile-development",
		title: "モバイルアプリ開発",
		category: "開発",
		description:
			"React NativeやFlutterを使用したクロスプラットフォームモバイルアプリケーションの開発サービスです。",
		features: [
			"iOS/Android対応",
			"ネイティブパフォーマンス",
			"プッシュ通知",
			"オフライン対応",
			"アプリストア申請サポート",
		],
		technologies: ["React Native", "Flutter", "Firebase", "Redux", "Expo"],
		price: "¥600,000〜",
		duration: "3-5ヶ月",
		icon: "📱",
	},
	{
		id: "consulting",
		title: "デジタル戦略コンサルティング",
		category: "コンサルティング",
		description:
			"DXの推進からシステム設計まで、お客様のビジネス目標達成をサポートする包括的なコンサルティングサービスです。",
		features: [
			"DX戦略策定",
			"システム要件定義",
			"技術選定支援",
			"プロジェクト管理",
			"チーム育成",
		],
		technologies: ["Agile", "Scrum", "Design Thinking", "Lean Startup", "OKR"],
		price: "¥200,000〜",
		duration: "1-2ヶ月",
		icon: "💼",
	},
	{
		id: "maintenance",
		title: "システム保守・運用",
		category: "運用",
		description:
			"既存システムの安定稼働を支援する包括的な保守・運用サービスです。24時間365日の監視体制でサポートします。",
		features: [
			"24時間監視",
			"定期メンテナンス",
			"セキュリティアップデート",
			"パフォーマンス監視",
			"バックアップ管理",
		],
		technologies: [
			"Datadog",
			"New Relic",
			"Jenkins",
			"Docker",
			"AWS CloudWatch",
		],
		price: "¥100,000〜/月",
		duration: "継続",
		icon: "🛠️",
	},
];

// フィルター機能付きサービス一覧コンポーネント（React 19の useTransition を使用）
// この部分はフィルタリング機能の責務: カテゴリに基づくサービスの絞り込み機能を提供
// テストではこう確認する: フィルターが正しく動作し、適切なサービスが表示されるかをテスト
function ServiceList() {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [isPending, startTransition] = useTransition();

	// カテゴリ一覧を動的に生成
	const categories = [
		"all",
		...new Set(services.map((service) => service.category)),
	];

	// フィルタリング処理
	const filteredServices =
		selectedCategory === "all"
			? services
			: services.filter((service) => service.category === selectedCategory);

	// カテゴリ変更処理（React 19の startTransition を使用）
	const handleCategoryChange = (category: string) => {
		startTransition(() => {
			setSelectedCategory(category);
		});
	};

	return (
		<div>
			{/* カテゴリフィルター */}
			<div className="flex flex-wrap justify-center gap-4 mb-12">
				{categories.map((category) => (
					<button
						key={category}
						type="button"
						onClick={() => handleCategoryChange(category)}
						className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
							selectedCategory === category
								? "bg-blue-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
						}`}
					>
						{category === "all" ? "すべて" : category}
					</button>
				))}
			</div>

			{/* サービス一覧（ローディング状態を表示） */}
			<div
				className={`transition-opacity duration-200 ${isPending ? "opacity-50" : "opacity-100"}`}
			>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{filteredServices.map((service) => (
						<ServiceCard key={service.id} service={service} />
					))}
				</div>
			</div>
		</div>
	);
}

// サービスカードコンポーネント
// この部分は個別サービス表示の責務: 各サービスの詳細情報を視覚的に表示
// テストではこう確認する: サービス情報が正しく表示され、インタラクションが適切に動作するかをテスト
function ServiceCard({ service }: { service: ServiceDetail }) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
			<div className="p-6">
				<div className="flex items-center mb-4">
					<span className="text-3xl mr-3">{service.icon}</span>
					<div>
						<h3 className="text-xl font-semibold text-gray-900">
							{service.title}
						</h3>
						<span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
							{service.category}
						</span>
					</div>
				</div>

				<p className="text-gray-600 mb-4 leading-relaxed">
					{service.description}
				</p>

				<div className="flex justify-between items-center mb-4">
					<div className="text-sm text-gray-500">
						<span className="font-semibold text-blue-600">{service.price}</span>{" "}
						| {service.duration}
					</div>
				</div>

				{/* 詳細情報の展開・収縮 */}
				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
				>
					{isExpanded ? "詳細を閉じる ↑" : "詳細を見る ↓"}
				</button>

				{isExpanded && (
					<div className="border-t pt-4 mt-4">
						<div className="mb-4">
							<h4 className="font-semibold text-gray-900 mb-2">
								主な機能・特徴
							</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								{service.features.map((feature) => (
									<li key={feature} className="flex items-start">
										<span className="text-green-500 mr-2">✓</span>
										{feature}
									</li>
								))}
							</ul>
						</div>

						<div>
							<h4 className="font-semibold text-gray-900 mb-2">使用技術</h4>
							<div className="flex flex-wrap gap-2">
								{service.technologies.map((tech) => (
									<span
										key={tech}
										className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
									>
										{tech}
									</span>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Services ページメインコンポーネント
// この部分はページ全体構成の責務: Services ページの全体的なレイアウトを定義
// テストではこう確認する: 全セクションが正しくレンダリングされ、ServiceList コンポーネントが適切に動作するかをテスト
export default function Services() {
	return (
		<div className="bg-gray-50 min-h-screen">
			{/* ヒーローセクション */}
			<div className="bg-white py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
							サービス一覧
						</h1>
						<p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
							お客様のニーズに合わせた幅広いテクノロジーソリューションをご提供しています。
							プロジェクトの規模や要件に応じて、最適なサービスをお選びください。
						</p>
					</div>
				</div>
			</div>

			{/* サービス一覧セクション */}
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<ServiceList />
				</div>
			</div>

			{/* お問い合わせCTA */}
			<div className="bg-blue-600 py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl font-extrabold text-white">
						ご質問やお見積もりはお気軽にどうぞ
					</h2>
					<p className="mt-4 text-xl text-blue-100">
						専門スタッフがお客様のプロジェクトに最適なソリューションをご提案いたします。
					</p>
					<div className="mt-8">
						<button
							type="button"
							className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold text-lg transition duration-200"
						>
							お問い合わせする
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
