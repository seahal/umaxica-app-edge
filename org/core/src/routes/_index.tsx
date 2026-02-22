import { EventList } from "../components/EventList";
import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Umaxica Organization - イベント一覧" },
    { name: "description", content: "コミュニティイベントに参加しましょう" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  const env =
    (context as unknown as { cloudflare?: { env?: Record<string, string> } })?.cloudflare?.env ??
    {};
  return { message: env.VALUE_FROM_CLOUDFLARE };
}

export default function Home(_: Route.ComponentProps) {
  return <EventList />;
}
