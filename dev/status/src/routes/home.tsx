import { DocsViewer } from '../components/DocsViewer';
import type { Route } from './+types/home';

export const meta: Route.MetaFunction = () => [
  { title: 'Umaxica Developers - ドキュメント' },
  { content: 'React Aria Components のドキュメント', name: 'description' },
];

export default function Home() {
  return <DocsViewer />;
}
