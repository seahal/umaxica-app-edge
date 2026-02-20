import { Hono } from "hono";
import { applySecurityHeaders } from "@umaxica/shared";
import { renderer } from "./renderer";

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  applySecurityHeaders(c);
});

app.get("/health", (c) => {
  const timestampIso = new Date().toISOString();
  return c.render(
    <div class="space-y-4">
      <p>✓ OK</p>
      <p>
        <strong>Timestamp:</strong> {timestampIso}
      </p>
    </div>,
  );
});

app.use(renderer);

app.get("/", (c) => {
  return c.render(
    <>
      <hr />
      <div class="space-y-4">
        <h2 class="text-3xl font-semibold text-gray-800">About this site.</h2>
        <p>
          This domain (<a href="https://umaxica.net">umaxica.net</a>) is not operated as a
          public-facing website. To access our services, please visit our official service site (
          <a href="https://umaxica.app">umaxica.app</a>) or our corporate site (
          <a href="https://umaxica.com">umaxica.com</a>).
        </p>
        <p>
          本ドメイン（<a href="https://umaxica.net">umaxica.net</a>
          ）は、一般向けのウェブサイトとして運用いたしておりません。
          弊社サービスの利用につきましては、サービスサイト (
          <a href="https://umaxica.app">umaxica.app</a>) またはコーポレートサイト (
          <a href="https://umaxica.com">umaxica.com</a>)
          の公式ウェブサイトへごアクセス賜りますようお願い申し上げます。
        </p>
      </div>
      <hr />
    </>,
  );
});

app.get("/about", (c) => {
  return c.render(
    <>
      <hr />
      <h2>Contact</h2>
      <p>For more information, please visit our main page.</p>
      <hr />
    </>,
  );
});

export default app;
