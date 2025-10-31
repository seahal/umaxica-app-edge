import { useLoaderData } from "react-router";
import {
	Table,
	TableHeader,
	Column,
	TableBody,
	Row,
	Cell,
	Tabs,
	TabList,
	Tab,
	TabPanel,
} from "react-aria-components";
import type { Route } from "../+types/home";

export const meta: Route.MetaFunction = () => [
	{ title: "Umaxica Developers - ステータス" },
	{ name: "description", content: "Umaxica の開発者向けサービスの稼働状況" },
];

type StatusLevel = "operational" | "degraded" | "maintenance" | "outage";
type IncidentStatus = "resolved" | "monitoring" | "investigating";

type ServiceStatus = {
	id: string;
	name: string;
	level: StatusLevel;
	description: string;
};

type Incident = {
	id: string;
	title: string;
	status: IncidentStatus;
	timeRange: string;
	description: string;
};

type HistoryEntry = {
	id: string;
	date: string;
	level: StatusLevel;
	summary: string;
	incidents: Incident[];
};

type LoaderData = {
	overall: {
		level: StatusLevel;
		message: string;
	};
	updatedAt: string;
	services: ServiceStatus[];
	history: HistoryEntry[];
	notice: string | null;
};

const STATUS_LABELS: Record<StatusLevel, string> = {
	operational: "正常",
	degraded: "一部遅延",
	maintenance: "メンテナンス",
	outage: "障害",
};

const STATUS_STYLES: Record<StatusLevel, string> = {
	operational:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
	degraded:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
	maintenance:
		"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
	outage:
		"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
	resolved: "解決済み",
	monitoring: "監視中",
	investigating: "調査中",
};

export function loader({ context }: Route.LoaderArgs): LoaderData {
	const env = context?.cloudflare?.env ?? {};
	const now = new Date();

	const normalizeDate = (base: Date, daysAgo: number) => {
		const date = new Date(base);
		date.setHours(12, 0, 0, 0);
		date.setDate(date.getDate() - daysAgo);
		return date.toISOString();
	};

	const history: HistoryEntry[] = [
		{
			id: "day-0",
			date: normalizeDate(now, 0),
			level: "degraded",
			summary:
				"Webhook 配信の再送キューに遅延が発生しています。順次解消中です。",
			incidents: [
				{
					id: "incident-webhook-delay",
					title: "Webhook 配信遅延",
					status: "monitoring",
					timeRange: "10:20 - 現在 JST",
					description:
						"高負荷キューの処理が滞留し、一部イベントで最大 6 分の遅延が発生しています。",
				},
			],
		},
		{
			id: "day-1",
			date: normalizeDate(now, 1),
			level: "operational",
			summary: "全てのサービスが正常に稼働しました。",
			incidents: [],
		},
		{
			id: "day-2",
			date: normalizeDate(now, 2),
			level: "maintenance",
			summary: "ドキュメント検索クラスタの予定メンテナンスを実施しました。",
			incidents: [
				{
					id: "incident-maintenance",
					title: "検索クラスタの夜間メンテナンス",
					status: "resolved",
					timeRange: "01:00 - 01:26 JST",
					description:
						"メンテナンス中は検索機能が読み取り専用モードとなり、書き込みは一時停止しました。",
				},
			],
		},
		{
			id: "day-3",
			date: normalizeDate(now, 3),
			level: "outage",
			summary:
				"Edge API 認証で一時的な失敗が発生しましたが現在は解消済みです。",
			incidents: [
				{
					id: "incident-auth-failure",
					title: "Edge API 認証エラー",
					status: "resolved",
					timeRange: "18:12 - 18:44 JST",
					description:
						"リージョン JP-1 のキャッシュ不整合により、署名検証が失敗して 401 応答が増加しました。",
				},
			],
		},
	];

	const services: ServiceStatus[] = [
		{
			id: "edge-api",
			name: "Edge API",
			level: "operational",
			description: "平均レスポンス 120ms・エラー率 0.02%。",
		},
		{
			id: "developer-console",
			name: "開発者コンソール",
			level: "operational",
			description: "デプロイ履歴の確認や設定更新が通常通りご利用いただけます。",
		},
		{
			id: "webhook-delivery",
			name: "Webhook 配信",
			level: "degraded",
			description:
				"再送キューを監視中です。到達まで最大 6 分の遅延が発生する場合があります。",
		},
	];

	const noticeCandidate =
		(env.STATUS_NOTICE ?? env.VALUE_FROM_CLOUDFLARE ?? "").trim() || null;

	return {
		overall: {
			level: "degraded",
			message: "Webhook 配信の遅延を監視しています。",
		},
		updatedAt: now.toISOString(),
		services,
		history,
		notice: noticeCandidate,
	};
}

function formatDate(dateString: string) {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("ja-JP", {
		month: "numeric",
		day: "numeric",
		weekday: "short",
	})
		.format(date)
		.replace("曜日", "");
}

function formatUpdatedAt(dateString: string) {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("ja-JP", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date);
}

function StatusBadge({ level }: { level: StatusLevel }) {
	return (
		<span
			className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[level]}`}
		>
			<span className="h-2 w-2 rounded-full bg-current" aria-hidden />
			{STATUS_LABELS[level]}
		</span>
	);
}

export default function Index() {
	const { overall, updatedAt, services, history, notice } =
		useLoaderData<typeof loader>();

	return (
		<main className="min-h-screen bg-gray-50 dark:bg-gray-950">
			<div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
				<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
								サービス稼働状況
							</h1>
							<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
								過去数日間の稼働履歴と現在の状況をお知らせします。
							</p>
						</div>
						<StatusBadge level={overall.level} />
					</div>

					<p className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
						{overall.message}
					</p>
					<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
						最終更新: {formatUpdatedAt(updatedAt)}
					</p>

					{notice && (
						<div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
							<span className="font-semibold">お知らせ:</span> {notice}
						</div>
					)}
				</section>

				<Tabs className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
					<TabList
						aria-label="稼働状況の詳細"
						className="flex border-b border-gray-200 text-sm dark:border-gray-800"
					>
						<Tab
							id="overview"
							className="flex-1 px-4 py-3 font-medium text-gray-600 outline-none transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 data-[selected]:bg-blue-50 data-[selected]:text-blue-700 dark:text-gray-400 dark:data-[selected]:bg-blue-900/20 dark:data-[selected]:text-blue-300"
						>
							概要
						</Tab>
						<Tab
							id="history"
							className="flex-1 px-4 py-3 font-medium text-gray-600 outline-none transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500 data-[selected]:bg-blue-50 data-[selected]:text-blue-700 dark:text-gray-400 dark:data-[selected]:bg-blue-900/20 dark:data-[selected]:text-blue-300"
						>
							履歴
						</Tab>
					</TabList>

					<TabPanel id="overview" className="p-6">
						<div className="grid gap-4 md:grid-cols-3">
							{services.map((service) => (
								<div
									key={service.id}
									className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950"
								>
									<div className="flex items-center justify-between">
										<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
											{service.name}
										</h2>
										<StatusBadge level={service.level} />
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{service.description}
									</p>
								</div>
							))}
						</div>
					</TabPanel>

					<TabPanel id="history" className="p-6">
						<Table
							aria-label="稼働履歴"
							className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
						>
							<TableHeader className="bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-900 dark:text-gray-400">
								<Column className="px-4 py-3" isRowHeader>
									日付
								</Column>
								<Column className="px-4 py-3">ステータス</Column>
								<Column className="px-4 py-3">概要</Column>
								<Column className="px-4 py-3">インシデント</Column>
							</TableHeader>
							<TableBody
								items={history}
								className="[&_tr]:border-b [&_tr]:border-gray-200 dark:[&_tr]:border-gray-800"
							>
								{(day: HistoryEntry) => (
									<Row
										id={day.id}
										className="bg-white text-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-900 dark:hover:bg-gray-800"
									>
										<Cell className="px-4 py-4 align-top font-medium text-gray-900 dark:text-gray-100">
											{formatDate(day.date)}
										</Cell>
										<Cell className="px-4 py-4 align-top">
											<StatusBadge level={day.level} />
										</Cell>
										<Cell className="px-4 py-4 align-top text-gray-700 dark:text-gray-300">
											{day.summary}
										</Cell>
										<Cell className="px-4 py-4 align-top text-gray-700 dark:text-gray-300">
											{day.incidents.length === 0 ? (
												<span className="text-xs text-gray-500 dark:text-gray-500">
													特筆事項はありません。
												</span>
											) : (
												<ul className="space-y-3 text-xs">
													{day.incidents.map((incident) => (
														<li
															key={incident.id}
															className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
														>
															<div className="flex flex-wrap items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
																<span>{incident.title}</span>
																<span className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
																	{INCIDENT_STATUS_LABELS[incident.status]}
																</span>
															</div>
															<p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
																{incident.timeRange}
															</p>
															<p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
																{incident.description}
															</p>
														</li>
													))}
												</ul>
											)}
										</Cell>
									</Row>
								)}
							</TableBody>
						</Table>
					</TabPanel>
				</Tabs>
			</div>
		</main>
	);
}
