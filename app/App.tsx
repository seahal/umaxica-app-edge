import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppIndex } from "./pages/app/Index";
import { AppAbout } from "./pages/app/About";
import { AppContact } from "./pages/app/Contact";
import { ComIndex } from "./pages/com/Index";
import { ComAbout } from "./pages/com/About";
import { OrgIndex } from "./pages/org/Index";
import { NotFound } from "./pages/NotFound";

export function App() {
	return (
		<Layout>
			<Routes>
				{/* App routes */}
				<Route path="/app" element={<AppIndex />} />
				<Route path="/app/about" element={<AppAbout />} />
				<Route path="/app/contact" element={<AppContact />} />

				{/* Com routes */}
				<Route path="/com" element={<ComIndex />} />
				<Route path="/com/about" element={<ComAbout />} />

				{/* Org routes */}
				<Route path="/org" element={<OrgIndex />} />

				{/* Default route */}
				<Route path="/" element={<AppIndex />} />

				{/* 404 */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</Layout>
	);
}
