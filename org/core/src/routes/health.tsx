export function loader() {
  return { timestamp: new Date().toISOString() };
}

export default function Health({ loaderData }: { loaderData: { timestamp: string } }) {
  return (
    <main>
      <h1>Health Check</h1>
      <p>status: ok</p>
      <p>timestamp: {loaderData.timestamp}</p>
    </main>
  );
}
