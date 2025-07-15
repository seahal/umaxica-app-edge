export function NotFound() {
	return (
		<div className="px-4 py-6 sm:px-0">
			<div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
				<h2 className="text-3xl font-bold text-gray-900 mb-4">
					404 - Page Not Found
				</h2>
				<p className="text-gray-600 mb-4">
					The page you're looking for doesn't exist.
				</p>
				<a
					href="/"
					className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
				>
					Go Home
				</a>
			</div>
		</div>
	);
}
