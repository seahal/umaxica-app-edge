// Implementation of data helper as the one from react-router might not be picked up by linting tools
function data<T>(body: T, init?: number | ResponseInit): Response {
  const responseInit = typeof init === 'number' ? { status: init } : init;
  const headers = new Headers(responseInit?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(body), {
    ...responseInit,
    headers,
  });
}

type HealthLoaderData = {
  status: 'ok' | 'error';
  timestamp: string;
};

export function loader() {
  const timestamp = new Date().toISOString();

  try {
    return data<HealthLoaderData>({ status: 'ok', timestamp }, { status: 200 });
  } catch {
    return data<HealthLoaderData>({ status: 'error', timestamp }, { status: 503 });
  }
}

export default function Health({ loaderData }: { loaderData: HealthLoaderData }) {
  return (
    <main>
      <p>status: {loaderData.status}</p>
      <p>timestamp: {loaderData.timestamp}</p>
    </main>
  );
}
