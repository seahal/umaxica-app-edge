import { Style } from 'hono/css'

const Nav = () => (
  <nav>
    <a href="/">Home</a> | <a href="/about">About</a> | <a href="/contact">Contact</a>
  </nav>
)

export default function About() {
  return (
    <div>
      <Style />
      <header>
        <h1>Umaxica(app, edge)</h1>
      </header>
      <hr />
      <Nav />
      <h2>About</h2>
      <p>About page of umaxica</p>
      <hr />
      <footer>
        <p>© umaxica</p>
      </footer>
    </div>
  )
}