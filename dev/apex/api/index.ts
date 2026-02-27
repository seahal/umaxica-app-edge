import app from '../src/index';

export default function handler(request: Request): Promise<Response> {
  return app.fetch(request);
}
