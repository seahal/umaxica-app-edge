/* eslint-disable import/no-named-export, import/no-relative-parent-imports */
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import type { Route } from '../+types/home';
import type { MetaDescriptor } from 'react-router';
import { getEnv } from '../../context';

export function meta(_: Route.MetaArgs): MetaDescriptor[] {
  return [{ content: 'Welcome to React Router!', name: 'description' }];
}

export function loader({ context }: Route.LoaderArgs): { message: string } {
  const env = getEnv(context);
  return {
    message: env.VALUE_FROM_CLOUDFLARE ?? '',
  };
}

export default function Index(_: Route.ComponentProps): JSX.Element {
  return (
    <main className="p-4 container mx-auto">
      <h2>Notification</h2>
      <p>underconstrution...</p>
    </main>
  );
}
