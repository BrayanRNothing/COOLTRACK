import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import Button from '../../../shared/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
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
    <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
      <section className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-lg sm:p-8">
        <p className="badge badge-primary mb-4">COOLTRACK</p>
        <h1 className="text-2xl font-bold sm:text-3xl">Iniciar Sesión</h1>
        <p className="mt-1 mb-6 text-sm text-base-content/70">Accede con tu cuenta registrada.</p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="form-control">
            <span className="label-text mb-1 font-medium">Correo electrónico</span>
            <input
              type="email"
              className="input input-bordered"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="form-control">
            <span className="label-text mb-1 font-medium">Contraseña</span>
            <input
              type="password"
              className="input input-bordered"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </section>
    </div>
  )
}
