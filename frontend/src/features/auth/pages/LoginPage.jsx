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
    <main className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-gradient-to-br from-base-200 via-base-100 to-info/10 px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-info/20 blur-3xl" />
      </div>

      <section className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-base-300/60 bg-base-100/95 shadow-2xl lg:grid-cols-[1.05fr_1fr]">
        <aside className="hidden border-r border-base-300/70 bg-base-200/40 p-8 lg:block">
          <p className="badge badge-primary mb-5">COOLTRACK</p>
          <h1 className="text-3xl font-bold leading-tight">Bienvenido de nuevo</h1>
          <p className="mt-3 text-sm text-base-content/70">
            Inicia sesión para administrar clientes, asignaciones y mantenimientos desde un solo lugar.
          </p>

          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-base-300/70 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Panel Admin</p>
              <p className="mt-1 text-sm text-base-content/70">Gestiona técnicos, clientes y equipos.</p>
            </div>
            <div className="rounded-xl border border-base-300/70 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-info">Panel Técnico</p>
              <p className="mt-1 text-sm text-base-content/70">Consulta tareas y registra mantenimientos.</p>
            </div>
          </div>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="badge badge-primary mb-4 lg:hidden">COOLTRACK</p>
          <h2 className="text-2xl font-bold sm:text-3xl">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-base-content/70">Accede con tu usuario y contraseña registrados.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-base-300/60 bg-base-100 shadow-xl shadow-base-300/20">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-primary/10 via-info/10 to-transparent" />

              <div className="relative p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-base-content/55">
                      Acceso a la plataforma
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-base-content">Ingresa tus credenciales</h3>
                  </div>
                  <span className="badge badge-neutral badge-sm">Seguro</span>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-3.5 sm:p-4">
                    <label className="mb-2 block text-sm font-semibold text-base-content/85">Usuario</label>
                    <input
                      type="text"
                      className="input input-bordered h-12 w-full rounded-xl border-base-300/70 bg-base-100 px-4"
                      placeholder="tu_usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                      autoComplete="username"
                    />
                  </div>

                  <div className="rounded-2xl border border-base-300/60 bg-base-200/35 p-3.5 sm:p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className="text-sm font-semibold text-base-content/85">Contraseña</label>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs h-7 min-h-7 px-2 text-primary"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input input-bordered h-12 w-full rounded-xl border-base-300/70 bg-base-100 px-4"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
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

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading && <span className="loading loading-spinner loading-xs" aria-hidden="true" />}
              {loading ? 'Ingresando...' : 'Ingresar al sistema'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
