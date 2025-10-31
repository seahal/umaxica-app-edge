import { useState } from "react";
import {
	Button,
	Input,
	Label,
	SearchField,
	Tab,
	TabList,
	TabPanel,
	Tabs,
} from "react-aria-components";
import type { Route } from "../+types/home";
import {
	SearchResults,
	type Trend,
	type User,
} from "../../components/SearchResults";
import type { Post } from "../../components/PostCard";

export const handle = {
	titleName: "Explore",
	breadcrumb: () => "Explore",
};

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Umaxica - 探索" },
		{ name: "description", content: "ユーザー、投稿、トレンドを探索" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return {
		message: (context.cloudflare.env as Env & { VALUE_FROM_CLOUDFLARE: string })
			.VALUE_FROM_CLOUDFLARE,
	};
}

// サンプルデータ
const sampleUsers: User[] = [
	{
		id: "1",
		name: "田中太郎",
		username: "tanaka_taro",
		bio: "Webエンジニア | React と TypeScript が好き | 東京在住",
		followers: 1234,
		verified: true,
	},
	{
		id: "2",
		name: "山田花子",
		username: "yamada_hanako",
		bio: "デザイナー | UI/UX デザインに情熱を注いでいます",
		followers: 567,
		verified: false,
	},
	{
		id: "3",
		name: "佐藤次郎",
		username: "sato_jiro",
		bio: "フロントエンド開発者 | アクセシビリティ advocate",
		followers: 890,
		verified: true,
	},
];

const samplePosts: Post[] = [
	{
		id: "1",
		author: "田中太郎",
		username: "tanaka_taro",
		content:
			"React Aria を使ってアクセシブルなUIを作るのは楽しい！\nキーボード操作も完璧に動作します。",
		timestamp: "2時間前",
		likes: 45,
		reposts: 8,
		replies: 3,
	},
	{
		id: "2",
		author: "山田花子",
		username: "yamada_hanako",
		content:
			"新しいデザインシステムを構築中です。\nReact Aria Components はデザインの自由度が高くて最高！",
		timestamp: "5時間前",
		likes: 78,
		reposts: 12,
		replies: 6,
	},
	{
		id: "3",
		author: "佐藤次郎",
		username: "sato_jiro",
		content:
			"アクセシビリティは全てのユーザーのためのもの。\nReact Aria のおかげで実装が簡単になりました。",
		timestamp: "1日前",
		likes: 156,
		reposts: 34,
		replies: 18,
	},
];

const sampleTrends: Trend[] = [
	{
		id: "1",
		topic: "#ReactAria",
		category: "テクノロジー",
		posts: 12345,
	},
	{
		id: "2",
		topic: "#アクセシビリティ",
		category: "テクノロジー",
		posts: 8901,
	},
	{
		id: "3",
		topic: "#WebDevelopment",
		category: "テクノロジー",
		posts: 23456,
	},
];

export default function Search(_: Route.ComponentProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeSearch, setActiveSearch] = useState(""); // 実際に検索された文字列

	// 検索実行
	const handleSearch = () => {
		setActiveSearch(searchQuery);
	};

	// Enter キーで検索
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	// 検索結果のフィルタリング
	const filteredUsers = activeSearch
		? sampleUsers.filter(
				(user) =>
					user.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
					user.username.toLowerCase().includes(activeSearch.toLowerCase()) ||
					user.bio.toLowerCase().includes(activeSearch.toLowerCase()),
			)
		: [];

	const filteredPosts = activeSearch
		? samplePosts.filter(
				(post) =>
					post.content.toLowerCase().includes(activeSearch.toLowerCase()) ||
					post.author.toLowerCase().includes(activeSearch.toLowerCase()),
			)
		: [];

	const filteredTrends = activeSearch
		? sampleTrends.filter((trend) =>
				trend.topic.toLowerCase().includes(activeSearch.toLowerCase()),
			)
		: [];

	return (
		<div className="bg-white dark:bg-gray-950">
			<div className="max-w-2xl mx-auto">
				{/* 検索ヘッダー */}
				<div className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-10">
					<div className="p-4">
						{/* React Aria の SearchField コンポーネント */}
						<SearchField
							value={searchQuery}
							onChange={setSearchQuery}
							onKeyDown={handleKeyDown}
							className="w-full"
						>
							<Label className="sr-only">検索</Label>
							<div className="relative flex items-center gap-2">
								{/* 検索アイコン */}
								<div className="absolute left-4 text-gray-400 pointer-events-none">
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>検索</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									</svg>
								</div>

								{/* 検索入力フィールド */}
								<Input
									placeholder="ユーザー、投稿、トレンドを検索"
									className="w-full pl-12 pr-24 py-3 bg-gray-100 dark:bg-gray-900 border border-transparent rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
								/>

								{/* クリアボタンと検索ボタン */}
								<div className="absolute right-2 flex items-center gap-1">
									{searchQuery && (
										<Button
											onPress={() => {
												setSearchQuery("");
												setActiveSearch("");
											}}
											className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-500 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
										>
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<title>クリア</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</Button>
									)}
									<Button
										onPress={handleSearch}
										className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
									>
										検索
									</Button>
								</div>
							</div>
						</SearchField>
					</div>

					{/* 検索結果がある場合、タブを表示 */}
					{activeSearch && (
						<Tabs className="border-t border-gray-200 dark:border-gray-800">
							<TabList className="flex overflow-x-auto">
								<Tab
									id="all"
									className="flex-shrink-0 px-4 py-4 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-gray-900 dark:data-[selected]:text-gray-100 data-[selected]:border-b-4 data-[selected]:border-blue-500"
								>
									すべて
								</Tab>
								<Tab
									id="users"
									className="flex-shrink-0 px-4 py-4 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-gray-900 dark:data-[selected]:text-gray-100 data-[selected]:border-b-4 data-[selected]:border-blue-500"
								>
									ユーザー
								</Tab>
								<Tab
									id="posts"
									className="flex-shrink-0 px-4 py-4 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-gray-900 dark:data-[selected]:text-gray-100 data-[selected]:border-b-4 data-[selected]:border-blue-500"
								>
									投稿
								</Tab>
								<Tab
									id="trends"
									className="flex-shrink-0 px-4 py-4 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-gray-900 dark:data-[selected]:text-gray-100 data-[selected]:border-b-4 data-[selected]:border-blue-500"
								>
									トレンド
								</Tab>
							</TabList>

							{/* すべてのタブ */}
							<TabPanel id="all">
								<SearchResults
									query={activeSearch}
									posts={filteredPosts}
									users={filteredUsers}
									trends={filteredTrends}
									type="all"
								/>
							</TabPanel>

							{/* ユーザータブ */}
							<TabPanel id="users">
								<SearchResults
									query={activeSearch}
									users={filteredUsers}
									type="users"
								/>
							</TabPanel>

							{/* 投稿タブ */}
							<TabPanel id="posts">
								<SearchResults
									query={activeSearch}
									posts={filteredPosts}
									type="posts"
								/>
							</TabPanel>

							{/* トレンドタブ */}
							<TabPanel id="trends">
								<SearchResults
									query={activeSearch}
									trends={filteredTrends}
									type="trends"
								/>
							</TabPanel>
						</Tabs>
					)}
				</div>

				{/* 検索していない場合のトレンド表示 */}
				{!activeSearch && (
					<div className="p-4">
						<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
							いまどうしてる？
						</h2>
						<div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
							{sampleTrends.map((trend, index) => (
								<div
									key={trend.id}
									className={`p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
										index !== sampleTrends.length - 1
											? "border-b border-gray-200 dark:border-gray-800"
											: ""
									}`}
								>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{trend.category}でトレンド
									</div>
									<div className="font-bold text-gray-900 dark:text-gray-100 mt-1">
										{trend.topic}
									</div>
									<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
										{trend.posts.toLocaleString()} 件の投稿
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
