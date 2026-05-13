import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/useAuth'
import logo from '../../assets/cooltracklogopng.png'

const linksByRole = {
  ADMIN: [
    { to: '/admin/clientes', label: 'Clientes', icon: '👥' },
    { to: '/admin/tecnicos', label: 'Tecnicos', icon: '👷' },
    { to: '/admin/asignaciones', label: 'Asignaciones', icon: '📋' },
  ],
  TECNICO_CONTRATISTA: [
    { to: '/tecnico/dashboard', label: 'Trabajos', icon: '⚡' },
    { to: '/tecnico/mantenimientos/nuevo', label: 'Registrar', icon: '➕' },
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
    <div 
      className="min-h-screen flex flex-col font-sans relative"
      style={{ background: '#f2ecf2' }}
    >
      {/* ── Dot grid texture ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1c1d1 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          opacity: 0.4,
        }}
      />

      {/* Top Header */}
      {showNav && (
        <header className="sticky top-0 z-50 border-b border-white/40 bg-white/30 backdrop-blur-xl flex-none">
          <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-6 px-6 sm:px-10 h-20">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer flex items-center gap-3 group" onClick={() => navigate('/')}>
              <img 
                src={logo} 
                alt="Cooltrack" 
                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
              />
              <p className="text-xl font-black tracking-tighter text-slate-800 transition-colors duration-300 group-hover:text-blue-600">COOLTRACK</p>
            </div>

            {/* Desktop Nav */}
            {links.length > 0 && (
              <nav className="hidden lg:flex items-center gap-2 h-full">
                {links.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `h-12 px-6 flex items-center text-[10px] uppercase tracking-[0.2em] font-bold transition-all rounded-xl relative ${
                        isActive 
                          ? 'text-blue-600 bg-white/50 shadow-sm border border-white/60' 
                          : 'text-slate-400 hover:text-slate-800 hover:bg-white/30'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <span className="relative z-10 flex items-center gap-2">
                        <span className={isActive ? 'opacity-100' : 'opacity-40'}>{item.icon}</span>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            )}

            {/* User Info & Logout */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800">{currentUser.nombres}</span>
                <span className="text-[9px] uppercase text-slate-400 font-bold tracking-[0.2em] mt-0.5">{currentUser.rol}</span>
              </div>
              <div className="w-px h-6 bg-slate-300 hidden sm:block mx-1" />
              <button 
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/50 border border-white/60 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300" 
                onClick={handleLogout}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`relative z-10 flex-1 w-full ${showNav ? 'mx-auto max-w-screen-2xl px-6 pb-32 pt-10 sm:px-10 sm:pb-10' : 'p-0'}`}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {showNav && links.length > 0 && (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-xl overflow-hidden ring-1 ring-black/5">
          <div className="flex items-center justify-around h-16 px-2">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest">{item.label}</span>
                {/* Active Indicator */}
                <NavLink to={item.to}>
                  {({ isActive }) => isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full shadow-lg shadow-blue-400/50" />
                  )}
                </NavLink>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}

