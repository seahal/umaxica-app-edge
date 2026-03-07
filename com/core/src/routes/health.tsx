export function loader() {
  return { timestamp: new Date().toISOString() };
}

export default function Health({ loaderData }: { loaderData: { timestamp: string } }) {
  return (
    <main>
      <p>status: ok</p>
      <p>timestamp: {loaderData.timestamp}</p>
    </main>
  );
}
