import { EventList } from '../components/EventList';
import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  const codeName = _.data?.codeName || 'Umaxica';
  return [
    { title: `${codeName} (org)` },
    { content: 'コミュニティイベントに参加しましょう', name: 'description' },
    { content: 'index, follow', name: 'robots' },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  const env =
    (context as unknown as { cloudflare?: { env?: Record<string, string> } })?.cloudflare?.env ??
    {};
  return {
    codeName: env.BRAND_NAME?.trim() || 'Umaxica',
    message: env.VALUE_FROM_CLOUDFLARE,
  };
}

export default function Home(_: Route.ComponentProps) {
  return <EventList />;
}
