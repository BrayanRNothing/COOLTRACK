import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[calc(100vh-8rem)] place-items-center text-center">
      <section>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-base-content/70">La ruta solicitada no existe.</p>
        <Link className="btn btn-primary mt-4" to="/">
          Volver al inicio
        </Link>
      </section>
    </div>
  )
}
