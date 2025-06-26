import { Style } from 'hono/css'

export default function About() {
  return (
    <div>
      <Style />
      <header>
        <h1>Umaxica(org, edge)</h1>
      </header>
      <hr />
      <p>About page of umaxica</p>
      <hr />
      <footer>
        <p>© umaxica</p>
      </footer>
    </div>
  )
}