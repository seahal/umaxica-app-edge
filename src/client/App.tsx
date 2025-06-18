import { FC } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

const App: FC = () => {
	return (
		<BrowserRouter>
			<div>
				<nav>
					<Link to="/">Home</Link> | <Link to="/about">About</Link> |{" "}
					<Link to="/contact">Contact</Link>
				</nav>

				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/about" element={<About />} />
					<Route path="/contact" element={<Contact />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
};

const Home: FC = () => (
	<div>
		<h2>Welcome to umaxica</h2>
		<p>This is the home page.</p>
	</div>
);

const About: FC = () => (
	<div>
		<h2>About</h2>
		<p>About page of umaxica</p>
	</div>
);

const Contact: FC = () => (
	<div>
		<h2>Contact</h2>
		<p>Contact us at contact@umaxica.app</p>
	</div>
);

export default App;
