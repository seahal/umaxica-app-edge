import { useState } from "react";
import { Button, Tabs, TabList, Tab, TabPanel } from "react-aria-components";
import { PostCard, type Post } from "./PostCard";
import { NewPostDialog } from "./NewPostDialog";

// サンプルデータ
const initialPosts: Post[] = [
	{
		id: "1",
		author: "田中太郎",
		username: "tanaka_taro",
		content: "今日はいい天気ですね！散歩に行ってきます。",
		timestamp: "2時間前",
		likes: 42,
		reposts: 8,
		replies: 5,
	},
	{
		id: "2",
		author: "山田花子",
		username: "yamada_hanako",
		content:
			"新しいプロジェクトを始めました！\nReact Aria を使ってアクセシブルなUIを作っています。\n\n#React #ReactAria #アクセシビリティ",
		timestamp: "4時間前",
		likes: 128,
		reposts: 23,
		replies: 15,
	},
	{
		id: "3",
		author: "佐藤次郎",
		username: "sato_jiro",
		content: "コーヒーブレイク中☕\n午後も頑張ります！",
		timestamp: "6時間前",
		likes: 67,
		reposts: 3,
		replies: 8,
	},
	{
		id: "4",
		author: "鈴木美咲",
		username: "suzuki_misaki",
		content:
			"最近 Tailwind CSS v4 を触ってるけど、めちゃくちゃ書きやすくなってる！\nカスタマイズも簡単だし、開発体験が最高です。",
		timestamp: "8時間前",
		likes: 234,
		reposts: 45,
		replies: 32,
	},
	{
		id: "5",
		author: "高橋健",
		username: "takahashi_ken",
		content: "週末はキャンプに行く予定です🏕️\n久しぶりのアウトドア、楽しみ！",
		timestamp: "10時間前",
		likes: 89,
		reposts: 12,
		replies: 18,
	},
];

/**
 * SNS風のタイムラインコンポーネント
 * React Aria の Tabs を使ってタブ切り替えを実装
 */
export function Timeline() {
	const [posts, setPosts] = useState<Post[]>(initialPosts);

	// 新規投稿の追加
	const handleNewPost = (content: string) => {
		const newPost: Post = {
			id: Date.now().toString(),
			author: "あなた",
			username: "current_user",
			content,
			timestamp: "たった今",
			likes: 0,
			reposts: 0,
			replies: 0,
		};
		setPosts([newPost, ...posts]);
	};

	// いいねの処理
	const handleLike = (postId: string) => {
		setPosts(
			posts.map((post) =>
				post.id === postId ? { ...post, likes: post.likes + 1 } : post,
			),
		);
	};

	// リポストの処理
	const handleRepost = (postId: string) => {
		setPosts(
			posts.map((post) =>
				post.id === postId ? { ...post, reposts: post.reposts + 1 } : post,
			),
		);
	};

	// 返信の処理（デモ用）
	const handleReply = (postId: string) => {
		console.log(`返信: ${postId}`);
	};

	return (
		<div className="max-w-2xl mx-auto">
			{/* ヘッダーとタブ */}
			<Tabs className="border-b border-gray-200 dark:border-gray-800">
				<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
						ホーム
					</h2>
					<NewPostDialog onSubmit={handleNewPost} />
				</div>

				{/* タブリスト */}
				<TabList className="flex border-b border-gray-200 dark:border-gray-800">
					<Tab
						id="foryou"
						className="flex-1 px-4 py-4 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-gray-900 dark:data-[selected]:text-gray-100 data-[selected]:border-b-4 data-[selected]:border-blue-500"
					>
						おすすめ
					</Tab>
					<Tab
						id="following"
						className="flex-1 px-4 py-4 font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 data-[selected]:text-gray-900 dark:data-[selected]:text-gray-100 data-[selected]:border-b-4 data-[selected]:border-blue-500"
					>
						フォロー中
					</Tab>
				</TabList>

				{/* おすすめタブの内容 */}
				<TabPanel id="foryou">
					<div>
						{posts.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								onLike={handleLike}
								onRepost={handleRepost}
								onReply={handleReply}
							/>
						))}
					</div>

					{/* もっと読み込むボタン */}
					<div className="p-4 border-b border-gray-200 dark:border-gray-800">
						<Button className="w-full py-3 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
							もっと見る
						</Button>
					</div>
				</TabPanel>

				{/* フォロー中タブの内容 */}
				<TabPanel id="following">
					<div className="p-8 text-center text-gray-500 dark:text-gray-400">
						<p>フォロー中のユーザーの投稿がここに表示されます</p>
					</div>
				</TabPanel>
			</Tabs>
		</div>
	);
}
