import { DocsViewer } from '../components/DocsViewer';
import { readEnv } from '../context';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = ({ data }) => [
  { title: `${data?.codeName || 'Umaxica'} (dev)` },
  { content: 'React Aria Components のドキュメント', name: 'description' },
  { content: 'index, follow', name: 'robots' },
];

export function loader({ context }: Route.LoaderArgs) {
  return { codeName: readEnv(context, 'BRAND_NAME', 'Umaxica') };
}

export default function Home() {
  return <DocsViewer />;
}
