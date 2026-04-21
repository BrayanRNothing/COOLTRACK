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
            Inicia sesion para administrar clientes, asignaciones y mantenimientos desde un solo lugar.
          </p>

          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-base-300/70 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Panel Admin</p>
              <p className="mt-1 text-sm text-base-content/70">Gestiona tecnicos, clientes y equipos.</p>
            </div>
            <div className="rounded-xl border border-base-300/70 bg-base-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-info">Panel Tecnico</p>
              <p className="mt-1 text-sm text-base-content/70">Consulta tareas y registra mantenimientos.</p>
            </div>
          </div>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="badge badge-primary mb-4 lg:hidden">COOLTRACK</p>
          <h2 className="text-2xl font-bold sm:text-3xl">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-base-content/70">Accede con tu usuario y contraseña registrados.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="rounded-2xl bg-base-200/35 p-4 ring-1 ring-inset ring-base-300/50 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/60">
                  Credenciales
                </p>
                <span className="badge badge-outline badge-sm">Acceso seguro</span>
              </div>

              <div className="space-y-4.5">
                <label className="form-control w-full gap-2.5">
                  <span className="label-text text-xs font-semibold uppercase tracking-[0.12em] text-base-content/65">Usuario</span>
                  <input
                    type="text"
                    className="input input-bordered h-12 w-full border-base-300/70 bg-base-100/90 px-4"
                    placeholder="tu_usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </label>

                <label className="form-control w-full gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="label-text text-xs font-semibold uppercase tracking-[0.12em] text-base-content/65">Contraseña</span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input input-bordered h-12 w-full border-base-300/70 bg-base-100/90 px-4"
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
