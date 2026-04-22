import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'

const linksByRole = {
  ADMIN: [
    { to: '/admin/clientes', label: 'Clientes', icon: '👥' },
    { to: '/admin/tecnicos', label: 'Tecnicos', icon: '👷' },
    { to: '/admin/asignaciones', label: 'Asignaciones', icon: '📋' },
  ],
  TECNICO_CONTRATISTA: [
    { to: '/tecnico/dashboard', label: 'Trabajos', icon: '⚡' },
    { to: '/tecnico/mantenimientos/nuevo', label: 'Nuevo', icon: '➕' },
    { to: '/tecnico/historial', label: 'Historial', icon: '📜' },
  ],
}

export default function AppShell({ children }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isLoginPage = location.pathname === '/login'
  const showNav = currentUser && !isLoginPage
  const links = currentUser ? linksByRole[currentUser.rol] ?? [] : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-base-200/50 flex flex-col">
      {/* Top Header: Only visible when logged in and NOT on login page */}
      {showNav && (
        <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/80 backdrop-blur-md flex-none">
          <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-6 px-4 sm:px-8 h-16">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer flex items-center gap-2" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-content font-black text-xl shadow-lg shadow-primary/20">C</div>
              <p className="text-xl font-black tracking-tighter text-primary">COOLTRACK</p>
            </div>

<<<<<<< HEAD
          {/* Navigation Links */}
          {currentUser && links.length > 0 && (
            <nav className="flex items-center gap-1 flex-grow overflow-x-auto overflow-y-hidden h-full scrollbar-none">
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
=======
            {/* Desktop Nav */}
            {links.length > 0 && (
              <nav className="hidden md:flex items-center gap-1 h-full">
                {links.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `h-full px-5 flex items-center text-[10px] uppercase tracking-[0.2em] font-black transition-all border-b-2 relative top-[1px] ${
                        isActive 
                          ? 'border-primary text-primary bg-primary/5' 
                          : 'border-transparent text-base-content/40 hover:text-base-content hover:bg-base-200/50'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}
>>>>>>> b215569 (feat: optimizacion premium para dispositivos moviles y nueva navegacion inferior)

            {/* User Info & Logout */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold leading-none">{currentUser.nombres}</span>
                <span className="text-[9px] uppercase opacity-40 font-black tracking-tighter mt-0.5">{currentUser.rol}</span>
              </div>
              <button 
                className="btn btn-sm btn-ghost text-base-content/60 hover:text-error hover:bg-error/10 border-none px-2 h-10 w-10 sm:h-auto sm:w-auto rounded-full sm:rounded-lg" 
                onClick={handleLogout}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span className="hidden xl:inline ml-1 text-[10px] font-black uppercase">Salir</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 mx-auto w-full max-w-screen-2xl ${showNav ? 'px-4 pb-24 pt-4 sm:px-8 sm:pb-8 sm:pt-6' : 'p-0'}`}>
        <div className={`animate-in fade-in duration-500 h-full ${!showNav ? 'flex items-center justify-center' : ''}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav: Only visible when logged in, not on login page, and on mobile screens */}
      {showNav && links.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-xl border-t border-base-300 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 relative ${
                    isActive ? 'text-primary' : 'text-base-content/40'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-125 -translate-y-1' : ''}`}>
                      {item.icon}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                    {isActive && (
                      <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_8px_rgba(var(--p),0.5)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
