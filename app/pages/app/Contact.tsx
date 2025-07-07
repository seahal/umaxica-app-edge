export function AppContact() {
	return (
		<div className="px-4 py-6 sm:px-0">
			<div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
				<h2 className="text-3xl font-bold text-gray-900 mb-4">Contact App</h2>
				<p className="text-gray-600 mb-4">
					Get in touch with our App domain team for support and inquiries.
				</p>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<p className="text-gray-600">app@umaxica.com</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Phone
						</label>
						<p className="text-gray-600">+1 (555) 123-4567</p>
					</div>
				</div>
			</div>
		</div>
	);
}
