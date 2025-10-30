import { useState } from "react";
import {
	Button,
	Dialog,
	DialogTrigger,
	Heading,
	Label,
	ListBox,
	ListBoxItem,
	Modal,
	ModalOverlay,
	Popover,
	Select,
	SelectValue,
	Tabs,
	TabList,
	Tab,
} from "react-aria-components";

// 商品データの型
interface Product {
	id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	image: string;
	stock: number;
}

// サンプル商品データ
const products: Product[] = [
	{
		id: "1",
		name: "プレミアムプラン",
		description: "最高のパフォーマンスを提供するプランです",
		price: 9800,
		category: "プラン",
		image: "💎",
		stock: 100,
	},
	{
		id: "2",
		name: "スタンダードプラン",
		description: "バランスの取れた人気のプランです",
		price: 4800,
		category: "プラン",
		image: "⭐",
		stock: 200,
	},
	{
		id: "3",
		name: "ベーシックプラン",
		description: "始めるのに最適なプランです",
		price: 1980,
		category: "プラン",
		image: "🌟",
		stock: 500,
	},
	{
		id: "4",
		name: "アドオン: ストレージ拡張",
		description: "1TB の追加ストレージ",
		price: 980,
		category: "アドオン",
		image: "💾",
		stock: 1000,
	},
	{
		id: "5",
		name: "アドオン: 優先サポート",
		description: "24時間以内の優先対応",
		price: 1480,
		category: "アドオン",
		image: "🎧",
		stock: 300,
	},
];

/**
 * 商品カタログコンポーネント（商用サイト向け）
 * React Aria の Select、Tabs、DialogTrigger を使用
 */
export function ProductCatalog() {
	const [sortBy, setSortBy] = useState("price-asc");
	const [filterCategory, setFilterCategory] = useState("all");

	// フィルタリングとソート
	const filteredProducts = products
		.filter((p) => filterCategory === "all" || p.category === filterCategory)
		.sort((a, b) => {
			if (sortBy === "price-asc") return a.price - b.price;
			if (sortBy === "price-desc") return b.price - a.price;
			if (sortBy === "name") return a.name.localeCompare(b.name);
			return 0;
		});

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
			<div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
				{/* ヘッダー */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
						商品カタログ
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						あなたに最適なプランを見つけましょう
					</p>
				</div>

				{/* フィルターとソート */}
				<div className="mb-6 flex flex-wrap gap-4">
					{/* カテゴリフィルター（Tabs） */}
					<Tabs
						selectedKey={filterCategory}
						onSelectionChange={(key) => setFilterCategory(key as string)}
						className="flex-1"
					>
						<TabList className="flex gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
							<Tab
								id="all"
								className="px-4 py-2 rounded-md font-semibold text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[selected]:bg-blue-500 data-[selected]:text-white text-gray-600 dark:text-gray-400"
							>
								すべて
							</Tab>
							<Tab
								id="プラン"
								className="px-4 py-2 rounded-md font-semibold text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[selected]:bg-blue-500 data-[selected]:text-white text-gray-600 dark:text-gray-400"
							>
								プラン
							</Tab>
							<Tab
								id="アドオン"
								className="px-4 py-2 rounded-md font-semibold text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[selected]:bg-blue-500 data-[selected]:text-white text-gray-600 dark:text-gray-400"
							>
								アドオン
							</Tab>
						</TabList>
					</Tabs>

					{/* ソート選択（Select） */}
					<Select
						selectedKey={sortBy}
						onSelectionChange={(key) => setSortBy(key as string)}
						className="min-w-[200px]"
					>
						<Label className="sr-only">並び替え</Label>
						<Button className="w-full flex items-center justify-between gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm">
							<SelectValue />
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>選択</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</Button>
						<Popover className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mt-2 min-w-[200px] overflow-hidden">
							<ListBox className="outline-none">
								<ListBoxItem
									id="price-asc"
									className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 data-[selected]:bg-blue-100 dark:data-[selected]:bg-blue-900/40 data-[selected]:text-blue-600 dark:data-[selected]:text-blue-400 outline-none"
								>
									価格: 安い順
								</ListBoxItem>
								<ListBoxItem
									id="price-desc"
									className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 data-[selected]:bg-blue-100 dark:data-[selected]:bg-blue-900/40 data-[selected]:text-blue-600 dark:data-[selected]:text-blue-400 outline-none"
								>
									価格: 高い順
								</ListBoxItem>
								<ListBoxItem
									id="name"
									className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 data-[selected]:bg-blue-100 dark:data-[selected]:bg-blue-900/40 data-[selected]:text-blue-600 dark:data-[selected]:text-blue-400 outline-none"
								>
									名前順
								</ListBoxItem>
							</ListBox>
						</Popover>
					</Select>
				</div>

				{/* 商品グリッド */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredProducts.map((product) => (
						<ProductCard key={product.id} product={product} />
					))}
				</div>

				{/* 結果がない場合 */}
				{filteredProducts.length === 0 && (
					<div className="text-center py-12">
						<p className="text-gray-500 dark:text-gray-400">
							該当する商品が見つかりませんでした
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

// 商品カードコンポーネント
function ProductCard({ product }: { product: Product }) {
	return (
		<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-shadow">
			{/* 商品画像（絵文字） */}
			<div className="bg-gradient-to-br from-blue-400 to-purple-500 p-12 flex items-center justify-center">
				<div className="text-6xl">{product.image}</div>
			</div>

			{/* 商品情報 */}
			<div className="p-6">
				<h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
					{product.name}
				</h3>
				<p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
					{product.description}
				</p>

				{/* 価格と在庫 */}
				<div className="flex items-baseline gap-2 mb-4">
					<span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
						¥{product.price.toLocaleString()}
					</span>
					<span className="text-gray-500 dark:text-gray-400 text-sm">/月</span>
				</div>

				<div className="mb-4">
					<span className="text-sm text-gray-500 dark:text-gray-400">
						在庫: {product.stock} 個
					</span>
				</div>

				{/* 購入ダイアログ */}
				<DialogTrigger>
					<Button className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-lg">
						詳細を見る
					</Button>

					{/* 詳細モーダル */}
					<ModalOverlay className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<Modal className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
							<Dialog className="outline-none p-6">
								{({ close }) => (
									<>
										<div className="flex items-center justify-between mb-6">
											<Heading
												slot="title"
												className="text-2xl font-bold text-gray-900 dark:text-gray-100"
											>
												{product.name}
											</Heading>
											<Button
												onPress={close}
												className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
											>
												<svg
													className="w-6 h-6"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<title>閉じる</title>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</Button>
										</div>

										{/* 商品画像 */}
										<div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl p-16 flex items-center justify-center mb-6">
											<div className="text-9xl">{product.image}</div>
										</div>

										{/* 詳細情報 */}
										<div className="space-y-4 mb-6">
											<div>
												<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
													説明
												</h4>
												<p className="text-gray-600 dark:text-gray-400">
													{product.description}
												</p>
											</div>

											<div>
												<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
													価格
												</h4>
												<div className="flex items-baseline gap-2">
													<span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
														¥{product.price.toLocaleString()}
													</span>
													<span className="text-gray-500 dark:text-gray-400">
														/月
													</span>
												</div>
											</div>

											<div>
												<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
													在庫状況
												</h4>
												<p className="text-gray-600 dark:text-gray-400">
													{product.stock} 個在庫あり
												</p>
											</div>
										</div>

										{/* アクションボタン */}
										<div className="flex gap-3">
											<Button
												onPress={close}
												className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
											>
												閉じる
											</Button>
											<Button
												onPress={() => {
													alert(`${product.name} をカートに追加しました！`);
													close();
												}}
												className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-lg"
											>
												カートに追加
											</Button>
										</div>
									</>
								)}
							</Dialog>
						</Modal>
					</ModalOverlay>
				</DialogTrigger>
			</div>
		</div>
	);
}
