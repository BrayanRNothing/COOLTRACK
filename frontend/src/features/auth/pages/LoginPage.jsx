import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import Button from '../../../shared/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      if (user.rol === 'ADMIN') {
        navigate('/admin/clientes')
      } else {
        navigate('/tecnico/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-gradient-to-b from-base-200/70 via-base-100 to-base-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-45">
        <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-base-content/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-info/10 blur-3xl" />
      </div>

      <section className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-base-300/60 bg-base-100 shadow-2xl shadow-base-content/10 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden border-r border-base-300/70 bg-base-200/45 p-8 lg:flex lg:flex-col lg:justify-center">
          <p className="badge badge-neutral mb-5 w-fit">COOLTRACK</p>
          <h1 className="text-3xl font-bold leading-tight">Bienvenido de nuevo</h1>
          <p className="mt-3 text-sm text-base-content/70">
            Inicia sesión para administrar clientes, asignaciones y mantenimientos desde un solo lugar.
          </p>

          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-base-300/70 bg-base-100/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/70">Panel Admin</p>
              <p className="mt-1 text-sm text-base-content/70">Gestiona técnicos, clientes y equipos.</p>
            </div>
            <div className="rounded-xl border border-base-300/70 bg-base-100/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/70">Panel Técnico</p>
              <p className="mt-1 text-sm text-base-content/70">Consulta tareas y registra mantenimientos.</p>
            </div>
          </div>
        </aside>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="badge badge-neutral mb-4 w-fit lg:hidden">COOLTRACK</p>
          <h2 className="text-2xl font-bold sm:text-3xl">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-base-content/70">Accede con tu usuario y contraseña registrados.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="rounded-2xl border border-base-300/60 bg-base-100 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-base-300/70 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/50">Acceso a la plataforma</p>
                  <h3 className="mt-1 text-lg font-semibold">Ingresa tus credenciales</h3>
                </div>
                <span className="badge badge-outline badge-sm">Seguro</span>
              </div>

              <div className="space-y-5">
                <label className="form-control w-full">
                  <span className="mb-2.5 text-sm font-semibold text-base-content/85">Usuario</span>
                  <input
                    type="text"
                    className="input input-bordered h-12 w-full border-base-300 bg-base-100 px-4"
                    placeholder="tu_usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </label>

                <label className="form-control w-full">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-base-content/85">Contraseña</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs h-7 min-h-7 px-2 text-base-content/70 hover:text-base-content"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input input-bordered h-12 w-full border-base-300 bg-base-100 px-4"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </label>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
              >
                {error}
              </div>
            )}

            <Button type="submit" variant="neutral" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading && <span className="loading loading-spinner loading-xs" aria-hidden="true" />}
              {loading ? 'Ingresando...' : 'Ingresar al sistema'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
