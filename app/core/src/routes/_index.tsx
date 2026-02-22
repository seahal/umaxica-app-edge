import { Timeline } from "../components/Timeline";
import { getEnv } from "../context";
import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Umaxica - ホーム" },
    { name: "description", content: "Umaxica - 今何してる？" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  const env = getEnv(context);
  const message = env.VALUE_FROM_CLOUDFLARE ?? "";

  return { message };
}

export default function Home(_: Route.ComponentProps) {
  return (
    <div className="bg-white dark:bg-gray-950">
      <Timeline />
    </div>
  );
}
