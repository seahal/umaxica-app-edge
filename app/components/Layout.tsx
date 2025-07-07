import type { ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<h1 className="text-2xl font-bold text-gray-900">Umaxica</h1>
						<nav className="flex space-x-4">
							<a href="/app" className="text-gray-600 hover:text-gray-900">
								App
							</a>
							<a href="/com" className="text-gray-600 hover:text-gray-900">
								Com
							</a>
							<a href="/org" className="text-gray-600 hover:text-gray-900">
								Org
							</a>
						</nav>
					</div>
				</div>
			</header>
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
		</div>
	);
}
