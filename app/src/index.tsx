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
        <title>Umaxica App</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #f1f5f9; 
            color: #1e293b;
          }
          h1 { 
            color: #3b82f6; 
            margin-bottom: 16px; 
          }
          p { 
            line-height: 1.6; 
            margin-bottom: 12px; 
          }
          a { 
            color: #3b82f6; 
            text-decoration: none; 
          }
          a:hover { 
            text-decoration: underline; 
          }
          .btn {
            display: inline-block;
            padding: 10px;
            margin-right: 10px;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .btn-primary {
            background-color: #3b82f6;
          }
          .btn-primary:hover {
            background-color: #2563eb;
          }
          .btn-secondary {
            background-color: #6366f1;
          }
          .btn-secondary:hover {
            background-color: #4f46e5;
          }
        </style>
      </head>
      <body>
        <h1>Umaxica App</h1>
        <p>Welcome to the App domain of Umaxica. This is the main application interface.</p>
        <div style="margin-top: 20px;">
          <a href="/about" class="btn btn-primary">About</a>
          <a href="/contact" class="btn btn-secondary">Contact</a>
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
        <title>About - Umaxica App</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #f1f5f9; 
            color: #1e293b;
          }
          h1 { 
            color: #3b82f6; 
            margin-bottom: 16px; 
          }
          p { 
            line-height: 1.6; 
            margin-bottom: 12px; 
          }
          .btn {
            display: inline-block;
            padding: 10px;
            margin-right: 10px;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .btn-gray {
            background-color: #6b7280;
          }
          .btn-gray:hover {
            background-color: #4b5563;
          }
          .btn-primary {
            background-color: #6366f1;
          }
          .btn-primary:hover {
            background-color: #4f46e5;
          }
        </style>
      </head>
      <body>
        <h1>About App</h1>
        <p>This is the about page for the App domain. Here you can learn more about our application services.</p>
        <p>We provide comprehensive application solutions for your business needs.</p>
        <div style="margin-top: 20px;">
          <a href="/" class="btn btn-gray">Back to Home</a>
          <a href="/contact" class="btn btn-primary">Contact</a>
        </div>
      </body>
    </html>
  `)
})

app.get('/contact', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Contact - Umaxica App</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background-color: #f1f5f9; 
            color: #1e293b;
          }
          h1 { 
            color: #3b82f6; 
            margin-bottom: 16px; 
          }
          p { 
            line-height: 1.6; 
            margin-bottom: 12px; 
          }
          .btn {
            display: inline-block;
            padding: 10px;
            margin-right: 10px;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .btn-gray {
            background-color: #6b7280;
          }
          .btn-gray:hover {
            background-color: #4b5563;
          }
          .btn-primary {
            background-color: #3b82f6;
          }
          .btn-primary:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <h1>Contact Us</h1>
        <p>Get in touch with our App domain team.</p>
        <p>Email: contact@umaxica.app</p>
        <div style="margin-top: 20px;">
          <a href="/" class="btn btn-gray">Back to Home</a>
          <a href="/about" class="btn btn-primary">About</a>
        </div>
      </body>
    </html>
  `)
})

// Health check endpoints
app.get('/health', (c) => c.json({ status: 'OK', domain: 'app' }))
app.get('/health.json', (c) => c.json({ status: 'OK', domain: 'app' }))

export default app