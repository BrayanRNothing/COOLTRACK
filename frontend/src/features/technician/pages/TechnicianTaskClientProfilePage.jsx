import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../shared/ui/Button'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import { useWorkData } from '../../../app/providers/useWorkData'

function parseNotas(notas) {
  if (!notas) return { instrucciones: null, condensadoresSeleccionados: null }
  try {
    const parsed = JSON.parse(notas)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.condensadoresSeleccionados)) {
      return {
        instrucciones: parsed.instrucciones || null,
        condensadoresSeleccionados: parsed.condensadoresSeleccionados,
      }
    }
  } catch (_) {}
  return { instrucciones: notas, condensadoresSeleccionados: null }
}

export default function TechnicianTaskClientProfilePage() {
  const { asignacionId } = useParams()
  const navigate = useNavigate()
  const { getAsignacion, getMantenimientosByAsignacion, updateAsignacion } = useWorkData()

  const [asignacion, setAsignacion] = useState(null)
  const [mantenimientos, setMantenimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([getAsignacion(asignacionId), getMantenimientosByAsignacion(asignacionId)])
      setAsignacion(a)
      setMantenimientos(m)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [asignacionId, getAsignacion, getMantenimientosByAsignacion])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-blue-600" /></div>
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>
  if (!asignacion) return null

  const allClimas = asignacion.cliente?.climas || []
  const { instrucciones, condensadoresSeleccionados } = parseNotas(asignacion.notas)

  const selectedIds = condensadoresSeleccionados ? new Set(condensadoresSeleccionados.map(c => c.id)) : null
  const climas = selectedIds ? allClimas.filter(c => selectedIds.has(c.id)) : allClimas

  const totalClimas = climas.length
  const climasConMantenimiento = new Set(mantenimientos.map(m => m.idClima))
  const totalServiced = climas.filter(c => climasConMantenimiento.has(c.id)).length
  const allDone = totalClimas > 0 && totalServiced === totalClimas
  const isCompleted = asignacion.estado === 'COMPLETADA'

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await updateAsignacion(asignacionId, { estado: 'COMPLETADA' })
      setAsignacion(prev => ({ ...prev, estado: 'COMPLETADA' }))
      navigate('/tecnico/dashboard')
    } catch (e) { alert(e.message) }
    finally { setCompleting(false) }
  }

  return (
    <section className="min-h-screen sm:h-[calc(100vh-64px)] flex flex-col sm:overflow-hidden animate-in fade-in duration-500">
      {/* Sticky Top Bar */}
      <div className="flex-none bg-white/80 backdrop-blur-md pt-4 pb-4 mb-4 border-b border-slate-100 px-4 sm:px-6 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Breadcrumbs items={[
              { label: 'Panel', to: '/tecnico/dashboard' },
              { label: 'Detalle de Asignación' }
            ]} />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {isCompleted && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Completado</span>}
            <Link 
              to="/tecnico/dashboard"
              className="text-[10px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 sm:overflow-hidden px-4 sm:px-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-5 sm:overflow-y-auto pb-6 scrollbar-hide">
            
            {/* Info Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm text-sm">🏢</span>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Información del Cliente</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Cliente</p>
                  <p className="font-black text-slate-900 text-sm leading-tight mt-0.5">{asignacion.cliente?.numeroCliente} - {asignacion.cliente?.nombreOEmpresa}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Ubicación</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{asignacion.cliente?.ciudad || 'No especificada'}</p>
                  {asignacion.cliente?.telefono && <p className="text-xs text-slate-500 font-medium mt-0.5">{asignacion.cliente.telefono}</p>}
                </div>
                <div className="pt-4 border-t border-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Programada</span>
                    <span className="font-black text-slate-900">{new Date(asignacion.fechaProgramada).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Equipos Asignados</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{totalClimas}</span>
                  </div>
                </div>
              </div>
            </div>

            {(instrucciones || !isCompleted) && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 space-y-5">
                  {instrucciones && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📋</span>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Instrucciones del Admin</h3>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {instrucciones}
                      </p>
                    </div>
                  )}

                  {!isCompleted && (
                    <div className={`${instrucciones ? 'pt-5 border-t border-slate-50' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progreso</h3>
                          <p className="text-[10px] font-black text-blue-600 mt-1">{totalServiced} de {totalClimas} equipos</p>
                        </div>
                        <div className="radial-progress text-blue-600 text-[10px] font-black bg-blue-50/50" style={{ "--value": (totalServiced/totalClimas)*100 || 0, "--size": "2.8rem", "--thickness": "4px" }} role="progressbar">
                          {Math.round((totalServiced/totalClimas)*100 || 0)}%
                        </div>
                      </div>

                      <button
                        className={`w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2
                          ${allDone 
                            ? 'bg-slate-900 text-white hover:bg-black shadow-slate-200' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                        onClick={handleComplete}
                        disabled={!allDone || completing}
                      >
                        {completing ? <span className="loading loading-spinner loading-sm" /> : 'Terminar Trabajo'}
                      </button>
                      {!allDone && (
                        <p className="text-[9px] text-center mt-3 font-bold text-slate-300 uppercase tracking-widest">
                          Faltan {totalClimas - totalServiced} equipos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Equipos List */}
          <div className="lg:col-span-2 flex flex-col h-full sm:overflow-hidden pb-10">
            <div className="flex items-center justify-between px-2 mb-5 flex-none">
              <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Equipos por Atender</h2>
              {allDone && !isCompleted && <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-widest animate-pulse">✓ ¡Todos listos!</span>}
            </div>

            <div className="flex-1 sm:overflow-y-auto pr-2 pb-10 space-y-3 custom-scrollbar">
              {totalClimas === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-16 text-center">
                  <span className="text-4xl mb-4 block opacity-50">❄️</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No hay equipos asignados a este trabajo.</p>
                </div>
              ) : (
                climas.map((clima) => {
                  const mantsForThisClima = mantenimientos.filter(m => m.idClima === clima.id)
                  const done = mantsForThisClima.length > 0

                  return (
                    <div 
                      key={clima.id} 
                      className={`group relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden
                        ${done 
                          ? 'border-emerald-100 bg-emerald-50/10 shadow-none' 
                          : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
                    >
                      <div className="flex items-center gap-5 p-5">
                        {/* Status Icon */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-105
                          ${done ? 'bg-emerald-100 text-emerald-600 shadow-inner' : 'bg-blue-50 text-blue-500'}`}>
                          {done ? '✓' : '❄️'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <p className={`font-black text-base tracking-tight ${done ? 'text-emerald-900' : 'text-slate-900'}`}>{clima.numeroSerie}</p>
                            {done && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Realizado</span>}
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">{clima.marca} · {clima.modelo}</p>
                          {clima.geolocalizacion && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              <p className="text-[10px] font-bold text-slate-400 truncate">{clima.geolocalizacion}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {!isCompleted && (
                            <button
                              className={`h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center
                                ${done 
                                  ? 'bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'}`}
                              onClick={() => navigate(`/tecnico/mantenimientos/nuevo?asignacionId=${asignacionId}&climaId=${clima.id}`)}
                            >
                              {done ? 'Re-Registrar' : 'Registrar'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {done && (
                        <div className="bg-emerald-50 px-6 py-3 border-t border-emerald-100 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                            Mantenimiento guardado el {new Date(mantsForThisClima[0].fechaMantenimiento).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
