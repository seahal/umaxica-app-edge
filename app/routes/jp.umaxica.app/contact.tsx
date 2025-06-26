import { Style } from 'hono/css'

const Nav = () => (
  <nav>
    <a href="/">Home</a> | <a href="/about">About</a> | <a href="/contact">Contact</a>
  </nav>
)

export default function Contact() {
  return (
    <div>
      <Style />
      <header>
        <h1>Umaxica(app, edge)</h1>
      </header>
      <hr />
      <Nav />
      <h2>Contact</h2>
      <p>Contact us at contact@umaxica.app</p>
      <hr />
      <footer>
        <p>© umaxica</p>
      </footer>
    </div>
  )  
}