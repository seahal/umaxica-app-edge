export const dynamic = 'force-dynamic';

export default function SentryTest() {
  throw new Error('Sentry test error from app/core');
}
