import { connection } from 'next/server';
import { getRailsClient } from '../../lib/rails-client';
import { checkRailsHealth } from '../../lib/rails-health';

export async function GET() {
  await connection();
  const result = await checkRailsHealth(getRailsClient());
  return Response.json({ rails: result }, { status: result.kind === 'ok' ? 200 : 503 });
}
