/*
 * The `authInterrupts` 401 surface. Chrome-free like the other status
 * documents, and styled to match them — it rendered unstyled until Tailwind
 * arrived, which made it the one failure surface that looked broken rather
 * than deliberate.
 */
export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-content-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold leading-heading">401 - Unauthorized</h1>
      <p>Please log in to access this page.</p>
    </main>
  );
}
