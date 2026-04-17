import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

const linksByRole = {
  ADMIN: [
    { to: '/admin/clientes', label: 'Clientes' },
    { to: '/admin/tecnicos', label: 'Tecnicos' },
    { to: '/admin/asignaciones', label: 'Asignaciones' },
  ],
  TECNICO_CONTRATISTA: [
    { to: '/tecnico/dashboard', label: 'Mis trabajos' },
    { to: '/tecnico/mantenimientos/nuevo', label: 'Registrar mantenimiento' },
    { to: '/tecnico/historial', label: 'Historial de mantenimientos' },
  ],
}

export default function AppShell({ children }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const links = currentUser ? linksByRole[currentUser.rol] ?? [] : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-base-200/50">
      <header className="sticky top-0 z-50 glass-nav border-b border-base-300 bg-base-100/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-6 px-4 py-0 sm:px-8 h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <p className="text-xl font-black tracking-tighter text-primary">COOLTRACK</p>
          </div>

          {/* Navigation Links */}
          {currentUser && links.length > 0 && (
            <nav className="flex items-center gap-1 flex-grow overflow-x-auto h-full scrollbar-none">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `h-full px-4 flex items-center text-xs uppercase tracking-widest font-bold transition-all border-b-2 relative top-[1px] ${
                      isActive 
                        ? 'border-primary text-primary bg-primary/5' 
                        : 'border-transparent text-base-content/50 hover:text-base-content hover:bg-base-200/50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* User Section */}
          {currentUser && (
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-xs font-bold leading-none">{currentUser.nombres}</span>
                <span className="text-[10px] uppercase opacity-40 font-black tracking-tighter mt-0.5">{currentUser.rol?.replace('_', ' ')}</span>
              </div>
              <div className="h-8 w-px bg-base-300 hidden sm:block"></div>
              <button 
                className="btn btn-sm btn-ghost text-base-content/60 hover:text-error hover:bg-error/10 border-none px-2" 
                onClick={handleLogout}
                title="Cerrar sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span className="hidden xl:inline ml-1 text-[10px] font-black uppercase">Salir</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl px-4 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-6">
        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
