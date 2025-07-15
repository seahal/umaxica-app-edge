export function AppIndex() {
	return (
		<div className="px-4 py-6 sm:px-0">
			<div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
				<h2 className="text-3xl font-bold text-gray-900 mb-4">App Domain</h2>
				<p className="text-gray-600 mb-4">
					Welcome to the App domain of Umaxica. This is the main application
					interface.
				</p>
				<div className="flex space-x-4">
					<a
						href="/app/about"
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
					>
						About
					</a>
					<a
						href="/app/contact"
						className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
					>
						Contact
					</a>
				</div>
			</div>
		</div>
	);
}
