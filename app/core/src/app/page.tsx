import { redirect } from 'next/navigation';

export const maxDuration = 5;

export default function RootPage() {
  redirect('/home');
}
