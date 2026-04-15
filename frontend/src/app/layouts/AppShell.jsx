import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

const linksByRole = {
  admin: [
    { to: '/admin/clientes', label: 'Clientes' },
    { to: '/admin/tecnicos', label: 'Tecnicos' },
  ],
  technician: [
    { to: '/tecnico/dashboard', label: 'Mis trabajos' },
    { to: '/tecnico/mantenimientos/nuevo', label: 'Registrar mantenimiento' },
  ],
}

export default function AppShell({ children }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const links = currentUser ? linksByRole[currentUser.role] ?? [] : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm text-base-content/60">COOLTRACK</p>
            <p className="text-lg font-semibold">Panel de Operaciones</p>
          </div>

          {currentUser && (
            <button className="btn btn-sm btn-outline" onClick={handleLogout}>
              Cerrar sesion
            </button>
          )}
        </div>
      </header>

      {currentUser && links.length > 0 && (
        <nav className="border-b border-base-300 bg-base-100">
          <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  )
}
