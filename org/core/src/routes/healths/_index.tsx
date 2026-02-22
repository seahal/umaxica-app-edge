import type { Route } from "../+types/home";

export function meta(_: Route.MetaArgs) {
  return [{ name: "description", content: "status page" }];
}

export function loader({ context }: Route.LoaderArgs) {
  const env =
    (
      context as unknown as {
        cloudflare?: { env?: Record<string, string> };
      }
    )?.cloudflare?.env ?? {};
  return {
    message: env.VALUE_FROM_CLOUDFLARE,
  };
}

export default function Index(_: Route.ComponentProps) {
  return (
    <main className="p-4 container mx-auto">
      <h2>ok</h2>
    </main>
  );
}
