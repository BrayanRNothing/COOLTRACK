import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useWorkData } from '../../../app/providers/useWorkData'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import Button from '../../../shared/ui/Button'
import AssignTechnicianModal from '../../../shared/ui/AssignTechnicianModal'

export default function ClientProfilePage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { getCliente, getClimasByCliente, getAsignaciones } = useWorkData()

  const [cliente, setCliente] = useState(null)
  const [recientes, setRecientes] = useState([])
  const [activeAsignacion, setActiveAsignacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [cData, clData, aData] = await Promise.all([
        getCliente(clientId),
        getClimasByCliente(clientId),
        getAsignaciones()
      ])
      
      setCliente(cData)
      
      // Filter for active assignment for this client
      const active = aData.find(a => 
        a.idCliente === clientId && 
        (a.estado === 'PENDIENTE' || a.estado === 'EN_PROGRESO')
      )
      setActiveAsignacion(active)

      // Sort climas by updatedAt for recent activity
      const sorted = [...clData].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
      setRecientes(sorted)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientId, getCliente, getClimasByCliente, getAsignaciones])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="alert alert-error mt-4">{error}</div>
  if (!cliente) return null

  // Helper to determine activity type
  const getActivityInfo = (clima) => {
    const updated = new Date(clima.updatedAt).getTime()
    const created = new Date(clima.createdAt).getTime()
    const isNew = Math.abs(updated - created) < 2000 // Less than 2 seconds diff
    
    const maintCount = clima._count?.mantenimientos || 0

    if (isNew && maintCount === 0) return { label: 'Nuevo Registro', color: 'badge-success' }
    if (maintCount > 0) {
      const ordinals = ['1er', '2do', '3er', '4to']
      return { label: `${ordinals[maintCount - 1] || maintCount + '°'} Mant.`, color: 'badge-primary' }
    }
    return { label: 'Actualización', color: 'badge-ghost' }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Breadcrumbs items={[
          { label: 'Lista de clientes', to: '/admin/clientes' },
          { label: `Cliente: ${cliente.nombreOEmpresa}` }
        ]} />
        <div className="flex gap-2">
          <Link className="btn btn-sm btn-outline" to="/admin/clientes">
            ← Volver a la lista
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-stretch">
        {/* Client Info Card */}
        <div className="lg:col-span-1 h-full">
          <article className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-2xl shadow-inner">🏢</div>
              <div>
                <h3 className="text-xl font-black leading-tight">{cliente.nombreOEmpresa}</h3>
                <p className="text-xs font-bold opacity-40 uppercase tracking-wider mt-1">{cliente.numeroCliente}</p>
              </div>
            </div>

            <div className="space-y-4 flex-grow">
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-base-200/40 p-3 rounded-xl border border-base-300/30">
                  <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Ubicación / Ciudad</span>
                  <p className="font-semibold text-xs text-base-content">{cliente.ciudad || 'No especificada'}</p>
                </div>
                <div className="bg-base-200/40 p-3 rounded-xl border border-base-300/30">
                  <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Teléfono de contacto</span>
                  <p className="font-semibold text-xs text-base-content">{cliente.telefono || 'Sin teléfono'}</p>
                </div>
                <div className="bg-base-200/40 p-3 rounded-xl border border-base-300/30">
                  <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Correo Electrónico</span>
                  <p className="font-semibold text-xs break-all text-base-content">{cliente.email || 'Sin correo'}</p>
                </div>
              </div>

              {/* Active Assignment in Sidebar */}
              {activeAsignacion && (
                <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary text-primary-content flex items-center justify-center text-sm shadow-md">👨‍🔧</div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Asignación Activa</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold truncate">Técnico: <span className="text-primary">{activeAsignacion.tecnico?.nombres}</span></p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black py-0.5 px-2 rounded-full ${activeAsignacion.estado === 'EN_PROGRESO' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {activeAsignacion.estado === 'EN_PROGRESO' ? '⚡ Ejecutando' : '⏳ En camino'}
                      </span>
                      <span className="text-[10px] font-bold opacity-40">{new Date(activeAsignacion.fechaProgramada).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 mt-6 border-t border-base-200 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase opacity-30">Registro oficial</span>
              <span className="text-[10px] font-bold text-base-content/50">{new Date(cliente.createdAt).toLocaleDateString()}</span>
            </div>
          </article>
        </div>

        <div className="lg:col-span-2 space-y-6 flex flex-col">

          {/* Recent Activity Section (Floating) */}
          <div className="flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-6 gap-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Actividad reciente
              </h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setShowAssignModal(true)} 
                  className={activeAsignacion ? 'btn-secondary' : 'btn-primary'}
                >
                  {activeAsignacion ? 'Gestionar Asignación Activa' : 'Enviar técnico a Mantenimiento'}
                </Button>
                <Button size="sm" variant="success" onClick={() => navigate(`/admin/clientes/${clientId}/condensadores`)}>
                 Ver Lista Completa →
                </Button>
              </div>
            </div>

            <div className="grid gap-4 flex-grow px-1 py-2">
              {recientes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-base-300 p-8 text-center text-base-content/40 italic bg-base-200/20 flex items-center justify-center">
                  Este cliente aún no tiene equipos registrados en el sistema.
                </div>
              ) : (
                recientes.map(clima => {
                  const activity = getActivityInfo(clima)
                  return (
                    <div
                      key={clima.id}
                      className="rounded-2xl border border-base-300 bg-base-100 p-4 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md hover:scale-[1.005] transition-all cursor-pointer group"
                      onClick={() => navigate(`/admin/clientes/${clientId}/condensadores/${clima.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-base-200 group-hover:bg-primary/20 flex items-center justify-center text-xl transition-standard">❄️</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors">{clima.numeroSerie}</p>
                              <span className={`badge ${activity.color} badge-sm font-bold text-[8px] uppercase`}>{activity.label}</span>
                            </div>
                            <p className="text-xs text-base-content/60">{clima.marca} {clima.modelo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase opacity-40">Actualización</p>
                          <p className="text-xs font-black text-primary/70">{new Date(clima.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <AssignTechnicianModal
          clientId={clientId}
          clientNombre={cliente.nombreOEmpresa}
          editingAsignacion={activeAsignacion}
          onClose={() => {
            setShowAssignModal(false)
            fetchData() // Refresh status
          }}
        />
      )}
    </section>
  )
}
