import { Link, NavLink } from "react-router-dom";
import { Tooltip, TooltipTrigger } from "react-aria-components";

interface HeaderProps {
	codeName?: string;
	helpServiceUrl?: string;
	docsServiceUrl?: string;
	newsServiceUrl?: string;
}

export function Header({
	codeName = "",
	helpServiceUrl = "",
	docsServiceUrl = "",
	newsServiceUrl = "",
}: HeaderProps) {
	return (
		<header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
			<div className="mx-auto max-w-7xl px-2 sm:px-4">
				{/* ロゴと検索エリア */}
				<div className="flex min-h-16 flex-wrap items-center gap-2 py-2">
					{/* Logo */}
					<Link
						to="/"
						className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-500"
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
							<svg
								className="h-5 w-5 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<title>{codeName || "Umaxica"}</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
								/>
							</svg>
						</div>
						<span className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">
							{codeName || "Umaxica"}
						</span>
					</Link>

					{/* Navigation Links */}
					<nav className="flex flex-wrap items-center gap-1">
						<TooltipTrigger delay={0}>
							<NavLink
								to="/message"
								className={({ isActive }: { isActive: boolean }) =>
									`group relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm ${
										isActive
											? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 scale-110"
											: "text-gray-700 hover:bg-gray-100 hover:scale-105 dark:text-gray-300 dark:hover:bg-gray-800"
									}`
								}
							>
								💬
							</NavLink>
							<Tooltip className="animate-in fade-in zoom-in-95 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
								メッセージ
							</Tooltip>
						</TooltipTrigger>

						<TooltipTrigger delay={0}>
							<NavLink
								to="/notification"
								className={({ isActive }: { isActive: boolean }) =>
									`group relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm ${
										isActive
											? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 scale-110"
											: "text-gray-700 hover:bg-gray-100 hover:scale-105 dark:text-gray-300 dark:hover:bg-gray-800"
									}`
								}
							>
								🔔
							</NavLink>
							<Tooltip className="animate-in fade-in zoom-in-95 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
								通知
							</Tooltip>
						</TooltipTrigger>

						<TooltipTrigger delay={0}>
							<NavLink
								to="/configuration"
								className={({ isActive }: { isActive: boolean }) =>
									`group relative rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm ${
										isActive
											? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 scale-110"
											: "text-gray-700 hover:bg-gray-100 hover:scale-105 dark:text-gray-300 dark:hover:bg-gray-800"
									}`
								}
							>
								⚙️
							</NavLink>
							<Tooltip className="animate-in fade-in zoom-in-95 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
								設定
							</Tooltip>
						</TooltipTrigger>

						{/* External Links */}
						{newsServiceUrl && (
							<TooltipTrigger delay={0}>
								<a
									href={`https://${newsServiceUrl}`}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800 sm:text-sm"
								>
									📰
								</a>
								<Tooltip className="animate-in fade-in zoom-in-95 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
									ニュース
								</Tooltip>
							</TooltipTrigger>
						)}
						{docsServiceUrl && (
							<TooltipTrigger delay={0}>
								<a
									href={`https://${docsServiceUrl}`}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800 sm:text-sm"
								>
									📚
								</a>
								<Tooltip className="animate-in fade-in zoom-in-95 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
									ドキュメント
								</Tooltip>
							</TooltipTrigger>
						)}
						{helpServiceUrl && (
							<TooltipTrigger delay={0}>
								<a
									href={`https://${helpServiceUrl}`}
									target="_blank"
									rel="noopener noreferrer"
									className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800 sm:text-sm"
								>
									❓
								</a>
								<Tooltip className="animate-in fade-in zoom-in-95 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
									ヘルプ
								</Tooltip>
							</TooltipTrigger>
						)}
					</nav>

					{/* Search and Login - Right Side */}
					<div className="ml-auto flex flex-wrap items-center gap-3">
						<NavLink
							to="/explore"
							className={({ isActive }: { isActive: boolean }) =>
								`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-4 sm:text-sm ${
									isActive
										? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
										: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
								}`
							}
						>
							<svg
								className="h-3.5 w-3.5 sm:h-4 sm:w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<title>Explore</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 20l4-16m4 4 4 4-4 4m-12-4l-4 4 4 4"
								/>
							</svg>
							Explore
						</NavLink>
					</div>
				</div>
			</div>
		</header>
	);
}
