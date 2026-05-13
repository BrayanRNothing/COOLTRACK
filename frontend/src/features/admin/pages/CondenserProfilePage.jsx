import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWorkData } from '../../../app/providers/useWorkData'
import Breadcrumbs from '../../../shared/ui/Breadcrumbs'
import AssignTechnicianModal from '../../../shared/ui/AssignTechnicianModal'

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  const parsedDate = new Date(value)
  if (isNaN(parsedDate.getTime())) return value
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(parsedDate)
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

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-blue-600" /></div>
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>
  if (!clima) return <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 font-bold text-sm">No se encontró el condensador.</div>

  const recordsByYear = records.reduce((acc, record) => {
    const year = new Date(record.fechaMantenimiento).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(record)
    return acc
  }, {})
  const years = Object.keys(recordsByYear).sort((a, b) => b - a)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Nav */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Breadcrumbs items={[
          { label: 'Clientes', to: '/admin/clientes' },
          { label: client?.nombreOEmpresa || '...', to: `/admin/clientes/${clientId}` },
          { label: clima.numeroSerie }
        ]} />
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="h-9 px-5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            + Enviar técnico
          </button>
          <Link
            to={`/admin/clientes/${clientId}`}
            className="h-9 px-5 rounded-xl bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Volver
          </Link>
        </div>
      </div>

      {/* Specs Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl shadow-inner">❄️</div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{clima.numeroSerie}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{clima.marca} · {clima.modelo}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
              {records.length} mantenimiento{records.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Número de Serie', value: clima.numeroSerie },
            { label: 'Marca / Modelo', value: `${clima.marca} ${clima.modelo}` },
            { label: 'Cliente', value: client?.nombreOEmpresa },
            { label: 'Ubicación', value: clima.geolocalizacion || 'No especificada' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
              <p className="font-bold text-slate-900 text-sm break-words">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance History */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-black text-slate-900">Historial de Mantenimientos</h2>
        </div>

        {years.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 py-20 text-center">
            <div className="text-5xl mb-4">🔧</div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sin registros de mantenimiento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {years.map(year => (
              <details key={year} className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" open>
                <summary className="flex cursor-pointer list-none items-center justify-between px-8 py-5 hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-slate-900">{year}</span>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                      {recordsByYear[year].length} registro{recordsByYear[year].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 transition-transform group-open:rotate-180">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </summary>

                <div className="border-t border-slate-50 divide-y divide-slate-50">
                  {recordsByYear[year].map((record) => {
                    const fotos = [record.foto1Url, record.foto2Url, record.foto3Url].filter(Boolean)
                    return (
                      <div key={record.id} className="px-8 py-6 hover:bg-slate-50/50 transition-all">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-6">
                            {/* Technician */}
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">👨‍🔧</div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Técnico</p>
                                <p className="text-sm font-bold text-slate-900">
                                  {record.tecnico?.nombres} {record.tecnico?.apellidoPaterno}
                                </p>
                              </div>
                            </div>
                            {/* Date */}
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                              <p className="text-sm font-bold text-slate-900">{formatDateTime(record.fechaMantenimiento)}</p>
                            </div>
                          </div>

                          {fotos.length > 0 && (
                            <button
                              onClick={() => setModalFotos(fotos)}
                              className="h-9 px-4 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              Ver {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
                            </button>
                          )}
                        </div>

                        {record.observaciones && (
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas del servicio</p>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{record.observaciones}</p>
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

      {/* Photo Modal */}
      {modalFotos && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModalFotos(null)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
              <h3 className="text-lg font-black text-slate-900">Evidencia Fotográfica</h3>
              <button
                onClick={() => setModalFotos(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-8 grid sm:grid-cols-2 gap-4">
              {modalFotos.map((url, i) => (
                <img key={i} src={url} alt={`Evidencia ${i + 1}`} className="w-full rounded-2xl object-cover aspect-video border border-slate-100" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && clima && (
        <AssignTechnicianModal
          clientId={clientId}
          clientNombre={client?.nombreOEmpresa || ''}
          preselectedIds={[condenserId]}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  )
}