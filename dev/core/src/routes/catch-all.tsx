import { data } from 'react-router';
import type { Route } from './+types/catch-all';

export function meta(_: Route.MetaArgs) {
  return [
    { title: '404 - Page Not Found | Umaxica Developers' },
    {
      content:
        'The requested page could not be found. Please verify the URL or return to the home page.',
      name: 'description',
    },
    { content: 'noindex, nofollow', name: 'robots' },
  ];
}

export function loader(_: Route.LoaderArgs) {
  throw data(null, { status: 404 });
}

export default function CatchAll() {
  return null;
}
