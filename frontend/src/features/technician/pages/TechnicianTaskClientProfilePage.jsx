import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../shared/ui/Button'
import PageHeader from '../../../shared/ui/PageHeader'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import { useWorkData } from '../../../app/providers/useWorkData'

/**
 * Parses the notas field, which may be:
 *  - A plain string (old format) -> { instrucciones: string, condensadoresSeleccionados: null }
 *  - A JSON string with { instrucciones, condensadoresSeleccionados } (new format)
 */
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
  // Plain string fallback (old format)
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

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="alert alert-error mt-4">{error}</div>
  if (!asignacion) return null

  const allClimas = asignacion.cliente?.climas || []
  const { instrucciones, condensadoresSeleccionados } = parseNotas(asignacion.notas)

  const selectedIds = condensadoresSeleccionados
    ? new Set(condensadoresSeleccionados.map(c => c.id))
    : null

  const climas = selectedIds
    ? allClimas.filter(c => selectedIds.has(c.id))
    : allClimas

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
    <section className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Sticky Top Bar */}
      <div className="flex-none bg-base-100/80 backdrop-blur-md pt-4 pb-4 mb-6 border-b border-base-200 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs items={[
            { label: 'Panel', to: '/tecnico/dashboard' },
            { label: 'Detalle del Trabajo' }
          ]} />
          <div className="flex items-center gap-2">
            {isCompleted && <span className="badge badge-success badge-sm font-bold px-3">TRABAJO COMPLETADO</span>}
            <Link className="btn btn-xs btn-ghost opacity-50 hover:opacity-100" to="/tecnico/dashboard">← Volver</Link>
          </div>
        </div>
      </div>

      {/* Main Content Area (Split Scroll) */}
      <div className="flex-1 overflow-hidden px-4 sm:px-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Sidebar Info (Always Visible) */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto pb-6 scrollbar-hide">
            <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
              <div className="bg-primary/5 px-4 py-3 border-b border-base-200">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Información General</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-40">Cliente</p>
                  <p className="font-bold text-sm leading-tight">{asignacion.cliente?.numeroCliente} - {asignacion.cliente?.nombreOEmpresa}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-40">Ubicación</p>
                  <p className="font-semibold text-sm">{asignacion.cliente?.ciudad || 'No especificada'}</p>
                  <p className="text-xs opacity-60 leading-none mt-1">{asignacion.cliente?.telefono || ''}</p>
                </div>
                <div className="pt-3 border-t border-base-200">
                  <p className="text-[10px] font-bold uppercase opacity-40 mb-2">Detalles del Trabajo</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium opacity-70">Programada</span>
                    <span className="font-bold">{asignacion.fechaProgramada?.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="font-medium opacity-70">Equipos Asignados</span>
                    <span className="badge badge-sm font-bold border-none bg-base-200">{totalClimas}</span>
                  </div>
                </div>
              </div>
            </div>

            {(instrucciones || !isCompleted) && (
              <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                <div className="p-4 space-y-4">
                  {instrucciones && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-primary/60">
                        <span className="text-sm">📋</span>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content/60">Instrucciones del Admin</h3>
                      </div>
                      <p className="text-xs font-medium leading-relaxed text-base-content/70 italic bg-base-200/30 p-3 rounded-lg border border-base-200">
                        "{instrucciones}"
                      </p>
                    </div>
                  )}

                  {!isCompleted && (
                    <div className="pt-2 border-t border-base-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Progreso del Trabajo</h3>
                          <p className="text-[11px] font-bold text-primary mt-0.5">{totalServiced} de {totalClimas} equipos registrados</p>
                        </div>
                        <div className="radial-progress text-primary text-[10px] font-bold" style={{ "--value": (totalServiced/totalClimas)*100, "--size": "2.5rem", "--thickness": "3px" }} role="progressbar">
                          {Math.round((totalServiced/totalClimas)*100)}%
                        </div>
                      </div>

                      <Button
                        className={`w-full shadow-lg transition-all duration-300 font-bold text-xs ${allDone ? 'btn-success' : 'btn-disabled opacity-40 grayscale'}`}
                        onClick={handleComplete}
                        disabled={!allDone || completing}
                      >
                        {completing ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          'Terminar Trabajo'
                        )}
                      </Button>
                      {!allDone && (
                        <p className="text-[9px] text-center mt-2 font-bold opacity-30 uppercase">Faltan {totalClimas - totalServiced} equipos por registrar</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Equipos List (Independently Scrollable) */}
          <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-1 mb-4 flex-none">
              <h2 className="font-black text-lg tracking-tight uppercase text-base-content/40 text-[12px]">Equipos por Atender</h2>
              {allDone && !isCompleted && <span className="text-[10px] font-black text-success uppercase animate-pulse">✓ ¡Todos listos!</span>}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-3 custom-scrollbar">
              {totalClimas === 0 ? (
                <div className="card bg-base-100 border border-dashed border-base-300 p-12 text-center">
                  <p className="text-base-content/40 font-medium">No hay equipos asignados a este trabajo.</p>
                </div>
              ) : (
                climas.map((clima) => {
                  const mantsForThisClima = mantenimientos.filter(m => m.idClima === clima.id)
                  const done = mantsForThisClima.length > 0

                  return (
                    <div 
                      key={clima.id} 
                      className={`group relative card bg-base-100 border transition-all duration-300 overflow-hidden
                        ${done 
                          ? 'border-success/30 bg-success/[0.02] shadow-sm' 
                          : 'border-base-300 hover:border-primary/50 shadow-sm hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Status Icon */}
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110
                          ${done 
                            ? 'bg-success text-success-content shadow-lg shadow-success/20' 
                            : 'bg-base-200 text-base-content/30'}`}>
                          {done ? '✓' : '⚙️'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-sm tracking-tight">{clima.numeroSerie}</p>
                            {done && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-success bg-success/10 px-1.5 rounded">Realizado</span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold uppercase opacity-40 mt-0.5 truncate">{clima.marca} · {clima.modelo}</p>
                          {clima.geolocalizacion && (
                            <div className="flex items-center gap-1 mt-1 opacity-50">
                              <span className="text-xs">📍</span>
                              <p className="text-[10px] truncate">{clima.geolocalizacion}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                          {!isCompleted && (
                            <Button
                              size="sm"
                              variant={done ? 'outline' : 'default'}
                              className={done ? 'border-success/30 text-success hover:bg-success hover:text-success-content' : 'shadow-md'}
                              onClick={() => navigate(`/tecnico/mantenimientos/nuevo?asignacionId=${asignacionId}&climaId=${clima.id}`)}
                            >
                              {done ? 'Registrar otro' : 'Registrar'}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {done && (
                        <div className="bg-success/10 px-4 py-2 border-t border-success/10">
                          <p className="text-[10px] font-bold text-success/70">
                            Mantenimiento registrado por ti el {mantsForThisClima[0].fechaMantenimiento?.slice(0, 10)}
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
