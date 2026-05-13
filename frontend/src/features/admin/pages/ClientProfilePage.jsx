import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useWorkData } from '../../../app/providers/useWorkData'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import AssignTechnicianModal from '../../../shared/ui/AssignTechnicianModal'

export default function ClientProfilePage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { getCliente, getClimasByCliente, getAsignaciones } = useWorkData()

  const [cliente, setCliente] = useState(null)
  const [climas, setClimas] = useState([])
  const [activeAsignacion, setActiveAsignacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [cData, clData, aData] = await Promise.all([
        getCliente(clientId),
        getClimasByCliente(clientId),
        getAsignaciones()
      ])
      setCliente(cData)
      const active = aData.find(a =>
        a.idCliente === clientId &&
        (a.estado === 'PENDIENTE' || a.estado === 'EN_PROGRESO')
      )
      setActiveAsignacion(active)
      setClimas([...clData].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientId, getCliente, getClimasByCliente, getAsignaciones])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-blue-600" /></div>
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>
  if (!cliente) return null

  const getActivityInfo = (clima) => {
    const maintCount = clima._count?.mantenimientos || 0
    if (maintCount > 0) return { label: `${maintCount}° Mant.`, bg: 'bg-blue-50', text: 'text-blue-600' }
    return { label: 'Sin mant.', bg: 'bg-slate-50', text: 'text-slate-400' }
  }

  const filtered = climas.filter(c =>
    c.numeroSerie?.toLowerCase().includes(search.toLowerCase()) ||
    c.marca?.toLowerCase().includes(search.toLowerCase()) ||
    c.modelo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <Breadcrumbs items={[
          { label: 'Clientes', to: '/admin/clientes' },
          { label: cliente.nombreOEmpresa }
        ]} />
        <Link
          to="/admin/clientes"
          className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">

        {/* ── SIDEBAR ── */}
        <div className="space-y-4">

          {/* Client info card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200 flex-shrink-0">
                {cliente.nombreOEmpresa.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">{cliente.nombreOEmpresa}</h2>
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">{cliente.numeroCliente}</span>
              </div>
            </div>

            <div className="border-t border-slate-50" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-base flex-shrink-0">📍</div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ciudad</p>
                  <p className="text-sm font-bold text-slate-800">{cliente.ciudad || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-base flex-shrink-0">📞</div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</p>
                  <p className="text-sm font-bold text-slate-800">{cliente.telefono || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-base flex-shrink-0">✉️</div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Correo</p>
                  <p className="text-sm font-bold text-slate-800 break-all">{cliente.email || '—'}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="border-t border-slate-50 pt-4 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{climas.length}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Condensadores</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">
                  {climas.reduce((acc, c) => acc + (c._count?.mantenimientos || 0), 0)}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Servicios</p>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Cliente desde</span>
              <span className="text-[10px] font-bold text-slate-500">{new Date(cliente.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Assignment / CTA */}
          {activeAsignacion ? (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-75">Técnico activo</span>
                </div>
                <p className="text-lg font-black">{activeAsignacion.tecnico?.nombres}</p>
                <p className="text-xs text-blue-200 font-bold mt-0.5 mb-5">Asignado a este cliente</p>
                <div className="flex justify-between pt-4 border-t border-white/10 text-[9px] font-bold uppercase tracking-widest text-blue-200">
                  <span>{activeAsignacion.estado === 'EN_PROGRESO' ? 'En ejecución' : 'Programado'}</span>
                  <span>{new Date(activeAsignacion.fechaProgramada).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="w-full h-10 rounded-2xl bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Gestionar asignación
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full bg-white rounded-3xl border-2 border-dashed border-slate-200 py-8 flex flex-col items-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/20 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🔧</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Enviar Técnico</span>
            </button>
          )}
        </div>

        {/* ── CONDENSADORES PANEL ── */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Condensadores</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{climas.length} equipo{climas.length !== 1 ? 's' : ''} registrado{climas.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por serie, marca o modelo..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* List */}
          <div className="p-4 flex-grow overflow-y-auto max-h-[60vh]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-4">❄️</span>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  {search ? 'Sin resultados' : 'Sin condensadores registrados'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(clima => {
                  const maintCount = clima._count?.mantenimientos || 0
                  return (
                    <button
                      key={clima.id}
                      onClick={() => navigate(`/admin/clientes/${clientId}/condensadores/${clima.id}`)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">❄️</div>

                      {/* Info block */}
                      <div className="flex-grow min-w-0 space-y-1.5">
                        {/* Row 1: serie + mantenimientos */}
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{clima.numeroSerie}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            maintCount > 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {maintCount > 0 ? `${maintCount} serv.` : 'Sin serv.'}
                          </span>
                        </div>
                        {/* Row 2: marca · modelo */}
                        <p className="text-xs font-bold text-slate-600">{clima.marca} <span className="text-slate-300">·</span> {clima.modelo}</p>
                        {/* Row 3: ubicación */}
                        {clima.geolocalizacion && (
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {clima.geolocalizacion}
                          </p>
                        )}
                      </div>

                      {/* Right: last service date */}
                      <div className="text-right hidden sm:block flex-shrink-0 space-y-1">
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Ult. servicio</p>
                        <p className="text-xs font-black text-slate-800">{new Date(clima.updatedAt).toLocaleDateString()}</p>
                        <p className="text-[8px] font-bold text-slate-400">
                          Reg. {new Date(clima.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Arrow */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-200 group-hover:text-blue-400 flex-shrink-0 transition-colors">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <AssignTechnicianModal
          clientId={clientId}
          clientNombre={cliente.nombreOEmpresa}
          editingAsignacion={activeAsignacion}
          onClose={() => { setShowAssignModal(false); fetchData() }}
        />
      )}
    </div>
  )
}
