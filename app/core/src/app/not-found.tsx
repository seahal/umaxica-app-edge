import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="status-page">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link href="/">Go home</Link>
    </main>
  );
}
