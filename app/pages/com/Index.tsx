export function ComIndex() {
	return (
		<div className="px-4 py-6 sm:px-0">
			<div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
				<h2 className="text-3xl font-bold text-gray-900 mb-4">
					hello world! from com
				</h2>
				<p className="text-gray-600 mb-4">
					Welcome to the Com domain of Umaxica. This is our commercial
					interface.
				</p>
				<div className="flex space-x-4">
					<a
						href="/about"
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
					>
						About
					</a>
				</div>
			</div>
		</div>
	);
}
