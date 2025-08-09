import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

app.get('/', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Umaxica Com</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #f8fafc; 
            color: #1e293b;
          }
          h1 { 
            color: #059669; 
            margin-bottom: 16px; 
          }
          p { 
            line-height: 1.6; 
            margin-bottom: 12px; 
          }
          a { 
            color: #0ea5e9; 
            text-decoration: none; 
          }
          a:hover { 
            text-decoration: underline; 
          }
          .btn {
            display: inline-block;
            padding: 10px;
            margin-right: 10px;
            background-color: #0ea5e9;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .btn:hover {
            background-color: #0284c7;
          }
        </style>
      </head>
      <body>
        <h1>Umaxica Com</h1>
        <p>Welcome to the Com domain of Umaxica. This is our commercial interface.</p>
        <div style="margin-top: 20px;">
          <a href="/about" class="btn">About</a>
        </div>
      </body>
    </html>
  `)
})

app.get('/about', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>About - Umaxica Com</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #f8fafc; 
            color: #1e293b;
          }
          h1 { 
            color: #059669; 
            margin-bottom: 16px; 
          }
          p { 
            line-height: 1.6; 
            margin-bottom: 12px; 
          }
          .btn {
            display: inline-block;
            padding: 10px;
            background-color: #6b7280;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .btn:hover {
            background-color: #4b5563;
          }
        </style>
      </head>
      <body>
        <h1>About Com</h1>
        <p>This is the about page for the Com domain. Learn more about our commercial services.</p>
        <p>We offer enterprise-grade commercial solutions for businesses worldwide.</p>
        <div style="margin-top: 20px;">
          <a href="/" class="btn">Back to Home</a>
        </div>
      </body>
    </html>
  `)
})

export default app