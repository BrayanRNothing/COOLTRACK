import { useState, useEffect, useCallback } from 'react'
import PageHeader from '../../../shared/ui/PageHeader'
import { useWorkData } from '../../../app/providers/useWorkData'

export default function TechnicianHistoryPage() {
  const { getMantenimientos } = useWorkData()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalFotos, setModalFotos] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getMantenimientos()
      setRecords(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [getMantenimientos])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg text-blue-600" /></div>
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-sm">{error}</div>

  return (
    <section className="animate-in fade-in duration-500">
      <PageHeader title="Historial de Mantenimientos" subtitle="Todos los registros de mantenimiento que has ejecutado en campo." />

      {records.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-16 text-center mt-6">
          <span className="text-4xl mb-4 block opacity-50">📜</span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aún no has registrado ningún mantenimiento</p>
        </div>
      ) : (
        <div className="grid gap-4 mt-6">
          {records.map(record => {
            const fotos = [record.foto1Url, record.foto2Url, record.foto3Url].filter(Boolean)
            return (
              <article key={record.id} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{record.clima?.cliente?.nombreOEmpresa}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100/50">
                          {record.clima?.numeroSerie}
                        </span>
                        <span className="text-[10px] font-bold opacity-60 uppercase text-slate-400">{record.clima?.marca} · {record.clima?.modelo}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Realizado</span>
                      <span className="font-bold text-slate-900 text-sm tracking-tight">{new Date(record.fechaMantenimiento).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {record.observaciones && (
                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Observaciones</p>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                        "{record.observaciones}"
                      </p>
                    </div>
                  )}

                  {fotos.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex -space-x-3">
                        {fotos.map((url, i) => (
                          <div key={i} className="w-10 h-10 rounded-xl border-2 border-white overflow-hidden bg-slate-100 shadow-sm">
                            <img src={url} className="w-full h-full object-cover" alt="miniatura" />
                          </div>
                        ))}
                      </div>
                      <button 
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5" 
                        onClick={() => setModalFotos(fotos)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Ver Evidencia ({fotos.length})
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Visor de Fotos Nativo (Mismo estilo que administrador) */}
      {modalFotos && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setModalFotos(null)} />
          
          <div className="relative z-10 w-full max-w-2xl max-h-full overflow-y-auto custom-scrollbar rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-6">
              {modalFotos.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt={`Evidencia ${i + 1}`} className="w-full rounded-3xl shadow-2xl ring-1 ring-white/10" />
                  <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                    Foto {i + 1}
                  </span>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 flex justify-center pb-6 pt-6 bg-gradient-to-t from-slate-950/50 to-transparent pointer-events-none">
              <button 
                className="w-14 h-14 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl transition-all pointer-events-auto shadow-xl ring-1 ring-white/20 hover:scale-105 active:scale-95" 
                onClick={() => setModalFotos(null)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
