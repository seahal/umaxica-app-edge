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
        <title>Umaxica Org</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #faf5ff; 
            color: #1e293b;
          }
          h1 { 
            color: #7c3aed; 
            margin-bottom: 16px; 
          }
          p { 
            line-height: 1.6; 
            margin-bottom: 12px; 
          }
          a { 
            color: #7c3aed; 
            text-decoration: none; 
          }
          a:hover { 
            text-decoration: underline; 
          }
          .btn {
            display: inline-block;
            padding: 10px;
            background-color: #7c3aed;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .btn:hover {
            background-color: #6d28d9;
          }
        </style>
      </head>
      <body>
        <h1>Umaxica Org</h1>
        <p>Welcome to the Org domain of Umaxica. This is our organizational interface.</p>
        <p>This domain serves organizational and administrative functions.</p>
        <div style="margin-top: 20px;">
          <a href="/admin" class="btn">Admin Panel</a>
        </div>
      </body>
    </html>
  `)
})

app.get('/admin', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin Panel - Umaxica Org</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #faf5ff; 
            color: #1e293b;
          }
          h1 { 
            color: #7c3aed; 
            margin-bottom: 16px; 
          }
          p { 
            line-height: 1.6; 
            margin-bottom: 12px; 
          }
          ul {
            margin: 16px 0;
            line-height: 1.8;
          }
          li {
            margin-bottom: 8px;
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
        <h1>Admin Panel</h1>
        <p>Administrative functions for Umaxica organization.</p>
        <ul>
          <li>User management</li>
          <li>System configuration</li>
          <li>Reports and analytics</li>
          <li>Security settings</li>
        </ul>
        <div style="margin-top: 20px;">
          <a href="/" class="btn">Back to Home</a>
        </div>
      </body>
    </html>
  `)
})

export default app