import { handle } from 'hono/vercel';
import { app } from './app';

export const runtime = 'edge';

export default handle(app);
