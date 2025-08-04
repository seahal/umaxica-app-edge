import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppIndex } from "./pages/app/Index";
import { AppAbout } from "./pages/app/About";
import { AppContact } from "./pages/app/Contact";
import { ComIndex } from "./pages/com/Index";
import { ComAbout } from "./pages/com/About";
import { OrgIndex } from "./pages/org/Index";
import { NotFound } from "./pages/NotFound";
import { useEffect, useState } from "react";

export function App() {
	const [tenant, setTenant] = useState<string>("");

	useEffect(() => {
		const hostname = window.location.hostname;
		if (
			hostname.includes("app.localhost") ||
			hostname.includes("umaxica.app")
		) {
			setTenant("app");
		} else if (
			hostname.includes("com.localhost") ||
			hostname.includes("umaxica.com")
		) {
			setTenant("com");
		} else if (
			hostname.includes("org.localhost") ||
			hostname.includes("umaxica.org")
		) {
			setTenant("org");
		} else {
			setTenant("app"); // default
		}
	}, []);

	return (
		<Layout>
			<Routes>
				{/* App routes */}
				{tenant === "app" && (
					<>
						<Route path="/" element={<AppIndex />} />
						<Route path="/about" element={<AppAbout />} />
						<Route path="/contact" element={<AppContact />} />
					</>
				)}

				{/* Com routes */}
				{tenant === "com" && (
					<>
						<Route path="/" element={<ComIndex />} />
						<Route path="/about" element={<ComAbout />} />
					</>
				)}

				{/* Org routes */}
				{tenant === "org" && (
					<>
						<Route path="/" element={<OrgIndex />} />
					</>
				)}

				{/* Legacy routes for backward compatibility */}
				<Route path="/app" element={<AppIndex />} />
				<Route path="/app/about" element={<AppAbout />} />
				<Route path="/app/contact" element={<AppContact />} />
				<Route path="/com" element={<ComIndex />} />
				<Route path="/com/about" element={<ComAbout />} />
				<Route path="/org" element={<OrgIndex />} />

				{/* 404 */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</Layout>
	);
}
