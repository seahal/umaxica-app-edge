import { getEnv } from '../../context';
import type { Route } from '../+types/home';

export function meta(_: Route.MetaArgs) {
  return [{ content: 'status page!', name: 'description' }];
}

export function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  return {
    message: env.VALUE_FROM_CLOUDFLARE ?? '',
  };
}

export default function Index(_: Route.ComponentProps) {
  return (
    <main className="p-4 container mx-auto">
      <h2>ok</h2>
    </main>
  );
}
