import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/useAuth'
import logo from '../../../assets/cooltracklogopng.png'

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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans relative overflow-hidden"
      style={{ background: '#f2ecf2' }}
    >
      {/* ── Dot grid texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1c1d1 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          opacity: 0.4,
        }}
      />

      {/* ── Unified Floating Container ── */}
      <div className="relative w-full max-w-md p-12">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
            src={logo}
            alt="Cooltrack"
            className="h-36 w-auto object-contain opacity-90"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Bienvenido
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Ingresa tus datos para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Username */}
          <div className="relative border-b border-slate-300 focus-within:border-slate-800 transition-colors duration-300">
            <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full py-3 bg-transparent text-slate-800 placeholder:text-slate-300 focus:outline-none text-base"
            />
          </div>

          {/* Password */}
          <div className="relative border-b border-slate-300 focus-within:border-slate-800 transition-colors duration-300">
            <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 bg-transparent text-slate-800 placeholder:text-slate-300 focus:outline-none text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-colors"
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center">
              <p className="text-xs font-bold text-red-500 animate-pulse">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-widest hover:bg-black transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'CARGANDO...' : 'INICIAR SESIÓN'}
            </button>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-12 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Cooltrack · Secure Access
          </p>
        </div>
      </div>

      {/* Page Footer */}
      <p className="mt-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        © {new Date().getFullYear()} All Rights Reserved
      </p>
    </div>
  )
}
