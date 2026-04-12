declare namespace Cloudflare {
  interface Env {
    ASSETS: Fetcher;
    WORKER_SELF_REFERENCE: Fetcher;
  }
}
interface CloudflareEnv extends Cloudflare.Env {}
