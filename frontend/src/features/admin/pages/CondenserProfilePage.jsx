import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWorkData } from '../../../app/providers/useWorkData'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import Button from '../../../shared/ui/Button'
import AssignTechnicianModal from '../../../shared/ui/AssignTechnicianModal'

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const parsedDate = new Date(value)
  if (isNaN(parsedDate.getTime())) return value
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(parsedDate)
}

export default function CondenserProfilePage() {
  const { clientId, condenserId } = useParams()
  const { getCliente, getClima, getMantenimientosByClima } = useWorkData()

  const [client, setClient] = useState(null)
  const [clima, setClima] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalFotos, setModalFotos] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [c, cl, m] = await Promise.all([
        getCliente(clientId),
        getClima(condenserId),
        getMantenimientosByClima(condenserId),
      ])
      setClient(c)
      setClima(cl)
      setRecords(m)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clientId, condenserId, getCliente, getClima, getMantenimientosByClima])

  useEffect(() => { fetchData() }, [fetchData])



  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>
  if (error) return <div className="alert alert-error mt-4">{error}</div>
  if (!clima) return <div className="alert alert-warning mt-4">No se encontró el condensador.</div>

  const recordsByYear = records.reduce((acc, record) => {
    const year = new Date(record.fechaMantenimiento).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(record)
    return acc
  }, {})
  const years = Object.keys(recordsByYear).sort((a, b) => b - a)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Breadcrumbs 
          items={[
            { label: 'Lista de clientes', to: '/admin/clientes' },
            { label: `Cliente: ${client?.nombreOEmpresa || '...'}`, to: `/admin/clientes/${clientId}` },
            { label: 'Lista de equipos', to: `/admin/clientes/${clientId}/condensadores` },
            { label: `Equipo: ${clima.numeroSerie}` }
          ]} 
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAssignModal(true)} className="btn-primary">
            + Enviar técnico
          </Button>
          <Link className="btn btn-sm btn-outline" to={`/admin/clientes/${clientId}/condensadores`}>Volver</Link>
        </div>
      </div>

      <article className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm transition-standard hover:shadow-md">
        <p className="text-xs font-bold uppercase tracking-widest mb-4 text-primary opacity-80">Especificaciones Técnicas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-xl bg-base-200/50 p-4 border border-base-300/30">
            <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Número de Serie</span>
            <p className="font-bold text-base-content">{clima.numeroSerie}</p>
          </div>
          <div className="rounded-xl bg-base-200/50 p-4 border border-base-300/30">
            <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Marca / Modelo</span>
            <p className="font-bold text-base-content">{clima.marca} {clima.modelo}</p>
          </div>
          <div className="rounded-xl bg-base-200/50 p-4 border border-base-300/30">
            <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Cliente</span>
            <p className="font-bold text-base-content truncate" title={client?.nombreOEmpresa}>{client?.nombreOEmpresa}</p>
          </div>
          <div className="rounded-xl bg-base-200/50 p-4 border border-base-300/30">
            <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Ubicación</span>
            <p className="font-bold text-base-content">{clima.geolocalizacion || 'No especificada'}</p>
          </div>
        </div>
      </article>

      {/* Maintenance History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Historial de Mantenimientos</h3>

        {years.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 p-12 text-center">
            <p className="text-base-content/40 font-medium italic">Aún no hay registros de mantenimiento para este equipo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {years.map(year => (
              <details key={year} className="group rounded-2xl border border-base-300 bg-base-100 shadow-sm" open>
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 px-8 hover:bg-base-200/30 transition-standard">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-base-content/90">{year}</span>
                    <span className="badge badge-md badge-ghost font-semibold opacity-60 group-open:opacity-100">{recordsByYear[year].length} registros</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180 opacity-40"><path d="m6 9 6 6 6-6"/></svg>
                </summary>

                <div className="p-6 border-t border-base-200 space-y-6">
                  {recordsByYear[year].map((record) => {
                    const fotos = [record.foto1Url, record.foto2Url, record.foto3Url].filter(Boolean)
                    return (
                      <div key={record.id} className="rounded-2xl border border-base-200 p-6 bg-base-200/10 transition-standard hover:border-primary/20">
                        <div className="flex flex-wrap justify-between gap-4 mb-4">
                          <div className="flex gap-8 text-sm">
                            <div>
                              <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Técnico</span>
                              <span className="font-semibold text-base-content">{record.tecnico?.nombres} {record.tecnico?.apellidoPaterno}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Fecha</span>
                              <span className="font-semibold text-base-content">{formatDateTime(record.fechaMantenimiento)}</span>
                            </div>
                          </div>
                          {fotos.length > 0 && (
                            <Button size="xs" variant="outline" onClick={() => setModalFotos(fotos)}>
                              Ver {fotos.length} fotos
                            </Button>
                          )}
                        </div>
                        
                        {record.observaciones && (
                          <div className="bg-base-100/50 p-3 rounded-lg border border-base-200/50">
                            <span className="text-[10px] font-bold uppercase opacity-40 block mb-1">Notas del servicio</span>
                            <p className="text-xs sm:text-sm">{record.observaciones}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {modalFotos && (
        <dialog className="modal modal-open" onClick={() => setModalFotos(null)}>
          <div className="modal-box max-w-3xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Evidencia Fotográfica</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {modalFotos.map((url, i) => (
                <img key={i} src={url} alt={`Evidencia ${i + 1}`} className="w-full rounded-xl object-cover aspect-video border border-base-300" />
              ))}
            </div>
            <div className="modal-action">
              <Button onClick={() => setModalFotos(null)}>Cerrar</Button>
            </div>
          </div>
        </dialog>
      )}

      {/* Assign Technician Modal */}
      {showAssignModal && clima && (
        <AssignTechnicianModal
          clientId={clientId}
          clientNombre={client?.nombreOEmpresa || ''}
          preselectedIds={[condenserId]}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </section>
  )
}